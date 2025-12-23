module.exports = (plugin) => {
  // Override the find method to ensure count is a number
  const originalFind = plugin.controllers['collection-types'].find;
  
  plugin.controllers['collection-types'].find = async (ctx) => {
    await originalFind(ctx);
    
    // Ensure pagination.total is a number, not an object
    if (ctx.body?.pagination) {
      if (typeof ctx.body.pagination.total === 'object' && ctx.body.pagination.total !== null) {
        // If total is an object with a count property, extract it
        if ('count' in ctx.body.pagination.total) {
          ctx.body.pagination.total = Number(ctx.body.pagination.total.count);
        } else {
          ctx.body.pagination.total = 0;
        }
      }
      
      // Ensure other pagination fields are numbers
      if (typeof ctx.body.pagination.pageCount === 'object') {
        ctx.body.pagination.pageCount = Number(ctx.body.pagination.pageCount.count || ctx.body.pagination.pageCount);
      }
    }
  };
  
  return plugin;
};
