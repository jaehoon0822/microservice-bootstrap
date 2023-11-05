interface SetTryCatchArgs {
  fn: (...args: any[]) => Promise<void>;
  message?: string;
}

const setTryCatch = async ({ fn, message }: SetTryCatchArgs) => {
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error) {
      if (message) {
        console.log(message);
      } else {
        console.log(error.message);
      }
    }
  }
};

export default setTryCatch;
