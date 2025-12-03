function asyncToGenerator(fn: Function) {
  return function (this: any, ...args: any[]) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const gen = fn.apply(self, args);

      function step(key: "next" | "throw", arg?: any): any {
        let info, value;
        try {
          info = gen[key](arg); // gọi generator
          value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value); // generator xong thì resolve
        } else {
          Promise.resolve(value).then(
            (val) => step("next", val),
            (err) => step("throw", err)
          );
        }
      }

      step("next");
    });
  };
}

export {asyncToGenerator}