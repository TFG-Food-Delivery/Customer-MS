import { Controller, Logger, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CustomerEmailDto,
  PaginationDto,
  UpdateCartDto,
  UpdateCustomerDto,
} from './dto';

/**
 * Controller for handling customer-related operations.
 */
@Controller()
export class CustomersController {
  /**
   * Constructs a new instance of CustomersController.
   * @param customersService - The service to handle customer operations.
   */
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Handles the creation of a new customer.
   * @param createCustomerDto - The data transfer object containing customer creation details.
   * @returns The created customer.
   */
  @MessagePattern('createCustomer')
  createCustomer(@Payload() createCustomerDto: CreateCustomerDto) {
    return this.customersService.createCustomer(createCustomerDto);
  }

  /**
   * Retrieves all customers with pagination.
   * @param paginationDto - The data transfer object containing pagination details.
   * @returns A list of customers.
   */
  @MessagePattern('findAllCustomers')
  findAllCustomers(@Payload() paginationDto: PaginationDto) {
    return this.customersService.findAllCustomers(paginationDto);
  }

  /**
   * Retrieves a single customer by ID.
   * @param id - The UUID of the customer.
   * @returns The customer with the specified ID.
   */
  @MessagePattern('findOneCustomer')
  findOneCustomer(@Payload('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOneCustomer(id);
  }

  /**
   * Retrieves a single customer by email.
   * @param customerEmailDto - The data transfer object containing the customer's email.
   * @returns The customer with the specified email.
   */
  @MessagePattern('findOneCustomerByEmail')
  findOneCustomerByEmail(@Payload() customerEmailDto: CustomerEmailDto) {
    const decodedEmail = decodeURIComponent(customerEmailDto.email);

    return this.customersService.findOneCustomerByEmail(decodedEmail);
  }

  /**
   * Retrieves the cart of a customer by ID.
   * @param id - The UUID of the customer.
   * @returns The cart of the customer with the specified ID.
   */
  @MessagePattern('findCustomerCart')
  findCustomerCart(@Payload('id', ParseUUIDPipe) id: string) {
    return this.customersService.findCustomerCart(id);
  }

  /**
   * Adds an item to the customer's cart.
   * @param addToCartDto - The data transfer object containing cart update details.
   * @returns The updated cart.
   */
  @MessagePattern('addToCart')
  addToCart(@Payload() addToCartDto: UpdateCartDto) {
    return this.customersService.addToCart(addToCartDto);
  }

  /**
   * Removes an item from the customer's cart.
   * @param removeFromCartDto - The data transfer object containing cart update details.
   * @returns The updated cart.
   */
  @MessagePattern('removeFromCart')
  removeFromCart(@Payload() removeFromCartDto: UpdateCartDto) {
    return this.customersService.removeFromCart(removeFromCartDto);
  }

  /**
   * Handles the event when an order is paid and restarts the customer's cart.
   * @param restartCartPayload - The payload containing details to restart the cart.
   * @returns The restarted cart.
   */
  @EventPattern('order_paid')
  paidOrder(@Payload() restartCartPayload) {
    return this.customersService.restartCart(restartCartPayload);
  }

  /**
   * Restarts the customer's cart.
   * @param restartCartPayload - The payload containing details to restart the cart.
   * @returns The restarted cart.
   */
  @MessagePattern('restartCart')
  restartCart(@Payload() restartCartPayload) {
    return this.customersService.restartCart(restartCartPayload);
  }

  @MessagePattern('setCart')
  setCart(
    @Payload()
    setCartPayload: {
      id: string;
      items: { dishId: string; quantity: number }[];
    },
  ) {
    return this.customersService.setCart(
      setCartPayload.id,
      setCartPayload.items,
    );
  }

  /**
   * Updates a customer's details.
   * @param updateCustomerDto - The data transfer object containing customer update details.
   * @returns The updated customer.
   */
  @EventPattern('updateCustomer')
  updateCustomer(@Payload() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.updateCustomer(updateCustomerDto);
  }

  /**
   * Deletes a customer by ID.
   * @param id - The UUID of the customer.
   * @returns The result of the deletion operation.
   */
  @MessagePattern('deleteCustomer')
  deleteCustomer(@Payload('id', ParseUUIDPipe) id: string) {
    return this.customersService.deleteCustomer(id);
  }
}
