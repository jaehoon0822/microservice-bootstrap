import amqp from "amqplib";

if (!process.env.RABBIT) {
  throw new Error("RabbitMQ 환견변수를 설정해주세요.");
}

const RABBIT = process.env.RABBIT;

const createChannel = async () => {
  return (await amqp.connect(RABBIT)).createChannel();
};

export default createChannel;
