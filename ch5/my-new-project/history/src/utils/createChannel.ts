import amqplib from "amqplib";

if (!process.env.RABBIT) {
  throw new Error("RABBIT variable not found");
}

const RABBIT = process.env.RABBIT;

const createChannel = async () => {
  return (await amqplib.connect(RABBIT)).createChannel();
};

export default createChannel;
