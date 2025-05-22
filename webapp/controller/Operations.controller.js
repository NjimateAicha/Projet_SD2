sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function(Controller) {
  "use strict";

  return Controller.extend("projectsd2.controller.Operations", {

    onInit: function () {
      // Rien de spécial ici, le SmartTable s'occupe de charger les données
    },

    onBeforeRebindFlux: function (oEvent) {
      // Ici, on ne met AUCUN filtre → toutes les données seront chargées
      // Tu peux ajouter un tri ou un filtre si tu veux plus tard
      const oBindingParams = oEvent.getParameter("bindingParams");
        
      // Créer un filtre pour Status = "Terminé"
      const oFilterTermine = new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "Chargement");
    
      // Appliquer le filtre à la table
      oBindingParams.filters = [oFilterTermine];
    },

    onTraiterPress: function () {
      sap.m.MessageToast.show("➡️ Traitement lancé (à implémenter)");
    },

    onEnCoursPress: function () {
      sap.m.MessageToast.show("↪️ Marqué comme en cours (à implémenter)");
    },
    onCorbeillePressMulti: function () {
      const oTable = this.byId("tblOperations");
      const oModel = this.getView().getModel();
    
      const oSelectedItem = oTable.getSelectedItem();
      if (!oSelectedItem) {
        sap.m.MessageToast.show("❗ Veuillez sélectionner une ligne.");
        return;
      }
    
      const oData = oSelectedItem.getBindingContext().getObject();
      const sIdflux = oData.Idflux;
    
      // Lire toutes les lignes avec le même Idflux
      oModel.read("/ZCDS_flux", {
        filters: [new sap.ui.model.Filter("Idflux", "EQ", sIdflux)],
        success: (oResult) => {
          const aLinesToDelete = oResult.results;
    
          if (aLinesToDelete.length === 0) {
            sap.m.MessageToast.show("Aucune ligne trouvée à supprimer.");
            return;
          }
    
          sap.m.MessageBox.confirm(`Supprimer la lignea du flux `, {
            title: "Confirmation",
            onClose: (sAction) => {
              if (sAction === "OK") {
                const aDeletes = aLinesToDelete.map((item) => {
                  const sPath = `/ZCDS_flux(Idflux='${item.Idflux}',Idcommande='${item.Idcommande}',Idchauffeur=${item.Idchauffeur},Idarticle='${item.Idarticle}')`;
                  return new Promise((resolve, reject) => {
                    oModel.remove(sPath, {
                      success: resolve,
                      error: reject
                    });
                  });
                });
    
                Promise.all(aDeletes)
                  .then(() => {
                    sap.m.MessageToast.show("✅ Toutes les lignes du flux ont été supprimées.");
                    this.byId("smartTableOperations").rebindTable();
                  })
                  .catch(() => {
                    sap.m.MessageBox.error("❌ Erreur lors de la suppression.");
                  });
              }
            }
          });
        },
        error: () => {
          sap.m.MessageBox.error("❌ Erreur lors de la lecture des flux.");
        }
      });
    }
    ,

    onEnCoursPress: function () {
      const oTable = this.byId("tblOperations");
      const oSelectedItem = oTable.getSelectedItem();
    
      if (!oSelectedItem) {
        sap.m.MessageToast.show("❗ Veuillez sélectionner une ligne.");
        return;
      }
    
      const oContext = oSelectedItem.getBindingContext();
      const oData = oContext.getObject();
    
      const sIdcommande = oData.Idcommande;
      const sIdchauffeur = oData.Idchauffeur;
    
      if (!sIdcommande || !sIdchauffeur) {
        sap.m.MessageToast.show("❌ Données manquantes.");
        return;
      }
    
      // ✅ Rediriger vers la page de traitement (vue Flux)
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("Flux", {
        Idcommande: sIdcommande,
        Idchauffeur: sIdchauffeur
      });
    }
    
    
    

  });
});
