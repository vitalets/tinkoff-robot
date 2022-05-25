/// <reference path="./package.json" />

exports.handler = async (...args) => {
  const { handler } = await import('../handler.js');
  return handler(...args);
}
