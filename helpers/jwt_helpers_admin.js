const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const config = require('config');

module.exports = {
  signAccessToken: (payload) => {
    console.log(payload);
    const userId = payload._id.toString();
    return new Promise((resolve, reject) => {
      const secret = config.get('jwtAdminPrivateKey');
      const options = {
        expiresIn: '1h',
        issuer: 'smurfApp.com',
        audience: userId,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err);
          reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        config.get('jwtAdminPrivateKey'),
        (err, payload) => {
          if (err) {
            const message =
              err.name === 'jsonWebTokenError'
                ? 'unauthorized'
                : err.message;
            reject(createError.Unauthorized(message));
          }
          resolve(payload);
        }
      );
    });
  },
  adminVerifyAccessToken: (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        config.get('jwtAdminPrivateKey'),
        (err, payload) => {
          if (err) {
            const message =
              err.name === 'jsonWebTokenError'
                ? 'unauthorized'
                : err.message;
            reject(createError.Unauthorized(message));
          }
          resolve(payload);
        }
      );
    });
  },
  signRefeshToken: (payload) => {
    const userId = payload._id.toString();
    return new Promise((resolve, reject) => {
      const secret = config.get('jwtAdminPrivateKeyRefresh');
      const options = {
        expiresIn: '1y',
        issuer: 'smurfApp.com',
        audience: userId,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err);
          reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        refreshToken,
        config.get('jwtAdminPrivateKeyRefresh'),
        (err, payload) => {
          if (err) {
            console.log(err);
            reject(createError.Unauthorized());
          }
          resolve(payload);
        }
      );
    });
  },
};
