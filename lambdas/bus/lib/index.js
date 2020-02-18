"use strict";

exports.__esModule = true;
exports.default = void 0;

var _pushNotification = require("./pushNotification");

var _pullNotifications = require("./pullNotifications");

var _lifecycle = require("./lifecycle");

var _constants = require("./constants");

const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  (0, _constants.updateEnvs)(context);

  switch (event.type) {
    case 'create':
      {
        return (0, _lifecycle.create)();
      }

    case 'drop':
      {
        return (0, _lifecycle.drop)();
      }

    case 'push':
      {
        return (0, _pushNotification.pushNotification)(event.payload);
      }

    case 'pull':
      {
        const {
          subscriptionId
        } = event.payload;
        return (0, _pullNotifications.pullNotifications)(subscriptionId);
      }

    case 'heartbeatBatch':
      {}

    case 'successBatch':
      {}

    case 'failureBatch':
      {}

    default:
      {
        throw new Error(`Unknown event.type = ${event.type}`);
      }
  }
};

var _default = handler;
exports.default = _default;
//# sourceMappingURL=index.js.map