import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  NATS_SERVERS: string[];
  LEADER_DATABASE_URL: string;
  // FOLLOWER1_DATABASE_URL: string;
  // FOLLOWER2_DATABASE_URL: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    LEADER_DATABASE_URL: joi.string().required(),
    // FOLLOWER1_DATABASE_URL: joi.string().required(),
    // FOLLOWER2_DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  natsServers: envVars.NATS_SERVERS,
  leaderDatabaseUrl: envVars.LEADER_DATABASE_URL,
  // follower1DatabaseUrl: envVars.FOLLOWER1_DATABASE_URL,
  // follower2DatabaseUrl: envVars.FOLLOWER2_DATABASE_URL,
};
