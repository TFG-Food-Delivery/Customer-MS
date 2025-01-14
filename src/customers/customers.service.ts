import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';
import { envs } from 'src/config';
import { PaginationDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CustomersService extends PrismaClient implements OnModuleInit {
  private readonly LOGGER = new Logger('CustomersService');

  onModuleInit() {
    // this.$extends(
    //   readReplicas({
    //     url: [envs.follower1DatabaseUrl, envs.follower2DatabaseUrl],
    //   }),
    // );
    this.$connect();
    this.LOGGER.log('Connected to the database');
  }
  async createCustomer(createCustomerDto: CreateCustomerDto) {
    const existingCustomer = await this.customer.findFirst({
      where: { email: createCustomerDto.email },
    });
    if (existingCustomer) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Customer with email ${createCustomerDto.email} already exists`,
      });
    }

    return this.customer.create({
      data: {
        id: createCustomerDto.id,
        email: createCustomerDto.email,
        address: {
          create: createCustomerDto.address,
        },
        cart: {
          create: {},
        },
      },
    });
  }

  async findAllCustomers(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.customer.count();
    if (!totalPages) {
      const message = 'No customers found.';
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: message,
      });
    }
    return {
      data: await this.customer.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: Math.ceil(totalPages / limit),
      },
    };
  }

  async findOneCustomer(id: string) {
    const customer = await this.customer.findUnique({
      where: { id },
      include: { address: true },
    });
    if (!customer) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Customer #${id} not found`,
      });
    }

    return customer;
  }

  async findOneCustomerByEmail(email: string) {
    const customer = await this.customer.findUnique({
      where: { email },
    });
    if (!customer) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Customer with email ${email} not found`,
      });
    }
    return customer;
  }

  async updateCustomer(updateCustomerDto: UpdateCustomerDto) {
    const { id, address } = updateCustomerDto;

    await this.findOneCustomer(id);

    this.LOGGER.log(`Updating customer with ID ${id}`);

    return this.customer.update({
      where: { id },
      data: {
        address: {
          update: address,
        },
      },
    });
  }

  async findCustomerCart(id: string) {
    const cart = await this.cart.findUnique({
      where: { customerId: id },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Cart not found for customer with ID ${id}`,
      });
    }

    return cart.items;
  }

  async addToCart(addToCartDto: UpdateCartDto) {
    const customer = await this.findOneCustomer(addToCartDto.id);

    const cart = await this.cart.findUnique({
      where: { customerId: customer.id },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Cart not found for customer with ID ${customer.id}`,
      });
    }

    // Verify if item already exists in cart
    const existingCartItem = cart.items.find(
      (item) => item.dishId === addToCartDto.dishId,
    );
    if (existingCartItem) {
      // If item already exists, update the quantity
      return this.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + 1,
        },
      });
    } else {
      // Create a new item in the cart
      return this.cartItem.create({
        data: {
          cartId: cart.id,
          dishId: addToCartDto.dishId,
          quantity: 1,
        },
      });
    }
  }
  async removeFromCart(removeFromCartDto: UpdateCartDto) {
    const customer = await this.findOneCustomer(removeFromCartDto.id);

    const cart = await this.cart.findUnique({
      where: { customerId: customer.id },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Cart not found for customer with ID ${customer.id}`,
      });
    }

    const existingCartItem = cart.items.find(
      (item) => item.dishId === removeFromCartDto.dishId,
    );

    if (!existingCartItem) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Dish with ID ${removeFromCartDto.dishId} not found in the cart`,
      });
    }

    if (existingCartItem.quantity > 1) {
      return this.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity - 1,
        },
      });
    } else {
      return this.cartItem.delete({
        where: { id: existingCartItem.id },
      });
    }
  }

  async setCart(id: string, items: { dishId: string; quantity: number }[]) {
    const customer = await this.findOneCustomer(id);

    const cart = await this.cart.findUnique({
      where: { customerId: customer.id },
      include: { items: true },
    });

    if (!cart) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Cart not found for customer with ID ${customer.id}`,
      });
    }

    // Primero eliminamos todos los items existentes
    await this.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    // Luego creamos los nuevos items
    const cartItemPromises = items.map((item) => {
      return this.cartItem.create({
        data: {
          cartId: cart.id,
          dishId: item.dishId,
          quantity: item.quantity,
        },
      });
    });

    await Promise.all(cartItemPromises);

    return this.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
  }

  async restartCart(restartCartPayload) {
    const { customerId } = restartCartPayload;

    const cart = await this.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Cart not found for customer with ID ${customerId}`,
      });
    }

    return this.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  async deleteCustomer(id: string) {
    await this.findOneCustomer(id);
    return this.customer.delete({ where: { id } });
  }
}
