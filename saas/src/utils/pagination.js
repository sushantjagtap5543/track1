/**
 * Anti-Gravity Pagination Utility
 * Provides a standardized way to handle list results in Prisma.
 */

const paginate = async (model, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    model.count({ where: options.where || {} }),
    model.findMany({
      where: options.where || {},
      take: limit,
      skip: skip,
      orderBy: options.orderBy || { createdAt: 'desc' },
      include: options.include
    })
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = paginate;
