
  sap.ui.define([
    "sap/ui/core/mvc/Controller"
  ], function (Controller) {
    "use strict";
  
    return Controller.extend("projectsd2.controller.Dashboard", {
      onInit: function () {
        // Optionnel : chargement ou logique d'initialisation
      },
  
      onSideNavSelect: function (oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        const oRouter = this.getOwnerComponent().getRouter();
        if (sKey) {
          oRouter.navTo(sKey);
        }
      },
  
      onToggleSidebar: function () {
        const oVBox = this.byId("mainContentVBox").getParent().getItems()[0];
        oVBox.setVisible(!oVBox.getVisible());
      }
    });
  });
  