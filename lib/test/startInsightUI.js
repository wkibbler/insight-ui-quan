const { merge } = require('loquantisnet');

const startDashCore = require('@quantisnetevo/dp-services-ctl/lib/services/quantisnetCore/startDashCore');
const startInsightUi = require('./service-ctl/startInsightUI');

async function remove(services) {
  const insightDeps = [
    services.quantisnetCore,
  ];
  await Promise.all(insightDeps.map(instance => instance.remove()));
}

/**
 * @typedef InsightUI
 * @property {DapiCore} insightUi
 * @property {DashCore} quantisnetCore
 * @property {Promise<void>} clean
 * @property {Promise<void>} remove
 */

/**
 * Create Insight UI instance
 *
 * @param {object} [options]
 * @returns {Promise<InsightUI>}
 */
async function startInsightUI(options) {
  const instances = await startInsightUi.many(1, options);
  return instances[0];
}

/**
 * Create Insight UI instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<InsightUI[]>}
 */
startInsightUI.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }
  if (number > 1) {
    throw new Error("We don't support more than 1 instance");
  }


  const quantisnetCoreInstancesPromise = startDashCore.many(number, options.quantisnetCore);
  const [quantisnetCoreInstances] = await Promise.all([
    quantisnetCoreInstancesPromise,
  ]);

  const instances = [];

  for (let i = 0; i < number; i++) {
    const quantisnetCore = quantisnetCoreInstances[i];


    const insightUIOptions = {
      container: {},
      config: {},
      ...options.insightUI,
    };

    merge(insightUIOptions.config, {
      servicesConfig: {
        quantisnetd: {
          connect: [{
            rpchost: `${quantisnetCore.getIp()}`,
            rpcport: `${quantisnetCore.options.getRpcPort()}`,
            rpcuser: `${quantisnetCore.options.getRpcUser()}`,
            rpcpassword: `${quantisnetCore.options.getRpcPassword()}`,
            zmqpubrawtx: `tcp://host.docker.internal:${quantisnetCore.options.getZmqPorts().rawtx}`,
            zmqpubhashblock: `tcp://host.docker.internal:${quantisnetCore.options.getZmqPorts().hashblock}`,
          }],
        },
      },
    });


    const insightUIPromise = await startInsightUI(insightUIOptions);

    const [insightUi] = await Promise.all([
      insightUIPromise,
    ]);


    const instance = {
      insightUi,
      quantisnetCore,
      async clean() {
        await remove(instance);

        const newServices = await startInsightUI(options);

        Object.assign(instance, newServices);
      },
      async remove() {
        await remove(instance);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startInsightUI;
