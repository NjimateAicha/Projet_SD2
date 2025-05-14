sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (Controller) => {
  "use strict";

  return Controller.extend("projectsd2.controller.App", {
    onSideNavSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      const oRouter = this.getOwnerComponent().getRouter();

      switch (sKey) {
        case "Dashboard":
          oRouter.navTo("Dashboard");
          break;
        default:
          console.warn("Clé de navigation inconnue :", sKey);
      }
    }
  });
});
