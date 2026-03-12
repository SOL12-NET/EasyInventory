export default {
  STATUS_ORDER: ["available", "rented", "repair", "sold", "lost", "duplicate"],

  i18n(key) {
    return appsmith.store?.i18n_d?.[key] || key;
  },

  getItems() {
    return qDashboardItems.data?.results || [];
  },

  getLocationFilter() {
    return (inpLocationFilter.text || "").trim().toLowerCase();
  },

  getLocationValue(item) {
    return String(item?.location?.value || item?.location || "").trim();
  },

  getStatusValue(item) {
    return String(item?.status?.value || item?.status || "").trim().toLowerCase();
  },

  hasFrontPhoto(item) {
    const photoCard = item?.photo_card;
    if (typeof photoCard === "string")
      return photoCard.trim().length > 0;
    if (Array.isArray(photoCard))
      return photoCard.length > 0;

    const photos = item?.photos;
    if (typeof photos === "string")
      return photos.trim().length > 0;
    if (Array.isArray(photos)) {
      return photos.some((entry) => String(entry?.value || entry?.url || entry || "").trim().length > 0);
    }
    return false;
  },

  getFilteredItems() {
    const filter = this.getLocationFilter();
    if (!filter)
      return this.getItems();
    return this.getItems().filter((item) => this.getLocationValue(item).toLowerCase().includes(filter));
  },

  countByStatus(status) {
    const target = String(status || "").trim().toLowerCase();
    return this.getFilteredItems().filter((item) => this.getStatusValue(item) === target).length;
  },

  summary() {
    const filtered = this.getFilteredItems();
    const queryCount = Number(qDashboardItems.data?.count || 0);
    return {
      total: filtered.length,
      missingFront: filtered.filter((item) => !this.hasFrontPhoto(item)).length,
      queryCount,
      loadedCount: this.getItems().length,
      isTruncated: queryCount > this.getItems().length,
      statuses: this.STATUS_ORDER.map((status) => ({
        key: status,
        label: this.i18n(`status.${status}`),
        count: this.countByStatus(status)
      }))
    };
  }
};
