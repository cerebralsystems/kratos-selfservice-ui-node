var blocks = Object.create(null);

export const extend = function (this: object, name: string, context: any) {
  var block = blocks[name];
  if (!block) {
    block = blocks[name] = [];
  }

  block.push(context.fn(this));
};

export const block = function (name: string) {
  var val = (blocks[name] || []).join('\n');

  // clear the block
  blocks[name] = [];
  return val;
};
