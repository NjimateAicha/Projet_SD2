sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (Controller) => {
  "use strict";

  return Controller.extend("projectsd2.controller.App", {




    // Gère la sélection d’un élément du menu de 
    onSideNavSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      const oRouter = this.getOwnerComponent().getRouter();
   
      switch (sKey) {
        case "Dashboard":
         this.getOwnerComponent().getRouter().navTo("Dashboard");
          
          break;

          case "LanceOper":
            this.getOwnerComponent().getRouter().navTo("LanceOper");
             
             break;
         
          case "Operations":
            this.getOwnerComponent().getRouter().navTo("Operations");
             
             break;
             case "OperClose":
              this.getOwnerComponent().getRouter().navTo("OperClose");
                
                break;
        default:
          console.warn("Clé de navigation inconnue :", sKey);
      }
    },

    
    onToggleSidebar: function () {
      const oSidebar = this.byId("_IDGenVBox"); // C'est ta VBox sidebar
      const bVisible = oSidebar.getVisible();
      oSidebar.setVisible(!bVisible);
    }

  });
});
