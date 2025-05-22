sap.ui.define([
    "sap/ui/core/mvc/Controller"
  ], function(Controller) {
    "use strict";
  
        return Controller.extend("projectsd2.controller.OperClose", {

  
      onInit: function () {
        // Rien de spécial ici, le SmartTable s'occupe de charger les données
      },
  
      onBeforeRebindOperClose: function (oEvent) {
        const oBindingParams = oEvent.getParameter("bindingParams");
        
        // Créer un filtre pour Status = "Terminé"
        const oFilterTermine = new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "Terminé");
      
        // Appliquer le filtre à la table
        oBindingParams.filters = [oFilterTermine];
      },
      
  
    
      
  
    });
  });
  