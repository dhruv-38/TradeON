import { redis } from "@repo/redis";
import { checkTpSl } from "./tpsl.engine.js";
import { checkLiquidations } from "./liquidation.engine.js";

const STREAM = "market-events";

const GROUP = "market-group";

const CONSUMER = "engine-1";

export const startMarketConsumer = async () => {
    try {
      await redis.xGroupCreate(STREAM,GROUP,"$",
        {
          MKSTREAM: true,
        }
      );

    } catch {
      console.log("Market group exists");
    }

    while (true) {

      const messages = await redis.xReadGroup(GROUP,CONSUMER,
          {
            key: STREAM,
            id: ">",
          },
          {
            COUNT: 10,
            BLOCK: 5000,
          }
        );

      if (!messages)
        continue;

      for (const stream of messages) {
        for (const message of stream.messages) {

          const symbol = message.message.symbol as string;
          const price =Number(message.message.price);

          await checkTpSl(symbol,price);
          await checkLiquidations(symbol,price);

          await redis.xAck(STREAM,GROUP,message.id);
        }
      }
    }
  };