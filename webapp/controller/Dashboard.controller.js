sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, DateFormat) {
  "use strict";

  return Controller.extend("projectsd2.controller.Dashboard", {

    onInit: function () {
      const oDashboardModel = new JSONModel({
        totalFlux: 0,
        totalChargement: 0,
        totalTermine: 0,
        currentDate: new Date(),
        chartData: []
      });

      this.getView().setModel(oDashboardModel, "dashboard");
      this._loadFluxStats();
    },

    onAfterRendering: function () {
      this.byId("_IDGenGenericTile").addStyleClass("kpiTile fluxTile");
      this.byId("_IDGenGenericTile1").addStyleClass("kpiTile chargementTile");
      this.byId("_IDGenGenericTile2").addStyleClass("kpiTile termineTile");
    },

    _loadFluxStats: function () {
      const oModel = this.getOwnerComponent().getModel();
      const oDashboardModel = this.getView().getModel("dashboard");

      if (!oModel) {
        console.error("❌ Modèle OData non défini !");
        return;
      }

      oModel.read("/ZCDS_flux", {
        success: function (oData) {
          const results = oData.results;

          const totalFlux = results.length;
          const totalChargement = results.filter(f => f.Status === "Chargement").length;
          const totalTermine = results.filter(f => f.Status === "Terminé").length;

          oDashboardModel.setProperty("/totalFlux", totalFlux);
          oDashboardModel.setProperty("/totalChargement", totalChargement);
          oDashboardModel.setProperty("/totalTermine", totalTermine);

          oDashboardModel.setProperty("/chartData", [
            { status: "Chargement", count: totalChargement },
            { status: "Terminé", count: totalTermine }
          ]);
        },
        error: function () {
          sap.m.MessageBox.error("Erreur lors de la lecture des données ZCDS_flux.");
        }
      });
    },

    formatDate: function (oDate) {
      if (!oDate) return "";
      const oDateFormat = DateFormat.getDateTimeInstance({
        pattern: "dd/MM/yyyy 'à' HH:mm"
      });
      return oDateFormat.format(oDate);
    }

  });
});
