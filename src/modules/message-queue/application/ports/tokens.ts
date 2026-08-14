/** Abstraction over the message broker (publish side). Inject to emit/send events. */
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER');

/** The underlying singleton RabbitMQ ClientProxy connection. */
export const RABBITMQ_CLIENT = Symbol('RABBITMQ_CLIENT');

/** Transactional-outbox repository (persist + relay events reliably). */
export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');

/** Runs a unit of work inside a single DB transaction (used by the outbox). */
export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');
