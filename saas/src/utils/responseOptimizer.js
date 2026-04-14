/**
 * Utility to optimize API responses for mobile apps.
 * Supports "slim" mode and dynamic field selection.
 */

/**
 * Strips unnecessary fields from a position object or array of positions.
 * @param {Object|Array} data - Single position or array of positions.
 * @param {Object} options - Optimization options.
 * @param {boolean} options.slim - If true, strips attributes and internal IDs.
 * @param {Array<string>} options.fields - Specific fields to include.
 * @returns {Object|Array} Optimized data.
 */
export const optimizePositions = (data, options = {}) => {
  const { slim = false, fields = null } = options;
  
  const processItem = (item) => {
    let optimized = { ...item };

    if (slim) {
      // Remove heavy or internal fields
      delete optimized.attributes;
      delete optimized.network;
      delete optimized.valid;
    }

    if (fields && Array.isArray(fields)) {
      const filtered = {};
      fields.forEach(field => {
        if (optimized.hasOwnProperty(field)) {
          filtered[field] = optimized[field];
        }
      });
      return filtered;
    }

    return optimized;
  };

  return Array.isArray(data) ? data.map(processItem) : processItem(data);
};

/**
 * Paginates an array of items.
 * @param {Array} items - The items to paginate.
 * @param {number} page - Current page number.
 * @param {number} limit - Number of items per page.
 * @returns {Object} Paginated response.
 */
export const paginate = (items, page = 1, limit = 50) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = items.slice(startIndex, endIndex);

  return {
    data: results,
    pagination: {
      total: items.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(items.length / limit)
    }
  };
};

export default {
  optimizePositions,
  paginate
};
