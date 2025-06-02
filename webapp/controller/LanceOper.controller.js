sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/ODataUtils"
  ], function(Controller, ValueHelpDialog, Filter, FilterOperator, ODataUtils) {
    "use strict";
   
    
      return Controller.extend("projectsd2.controller.LanceOper", {
        onInit: function () {
          // Optionnel : chargement ou logique d'initialisation
        },
    
     
    
        onToggleSidebar: function () {
          const oVBox = this.byId("mainContentVBox").getParent().getItems()[0];
          oVBox.setVisible(!oVBox.getVisible());
        }
    ,
    onFieldSubmit: function (oEvent) {
      // Cette méthode est appelée quand on tape Entrée
      this.onPressGO();
    },
  
    onPressGO() {
    const sId   = this.byId("inIdCommande").getValue();
    const sNom  = this.byId("inNomClient").getValue();
    const sDate = this.byId("inDateCommande").getValue();
    const aFilters = [];
  
    if (sId)   aFilters.push(new Filter("Idcommande", FilterOperator.EQ, sId));
    if (sNom)  aFilters.push(new Filter("Nomclient",  FilterOperator.Contains, sNom));
    if (sDate) {
      const d = new Date(sDate);
      aFilters.push(new Filter("Datecommande",
                      FilterOperator.EQ,
                      ODataUtils.formatValue(d, "Edm.Date")));
    }
  
    // Récupère la Table interne (ResponsiveTable ou sap.ui.table.Table selon config)
    const oST = this.byId("smartTableLivraison");
    const oTable = oST.getTable();
    oTable.getBinding("items").filter(aFilters);
   
  }
  
  ,

  
  onOpenChauffeurVHD: function () {
    if (!this._oVhdChauffeur) {
      this._oVhdChauffeur = new ValueHelpDialog({
        supportMultiselect: false,
        key: "Nomchauffeur", // clé principale
        descriptionKey: "Nomchauffeur", // description affichée
        title: "Sélectionner un chauffeur",
        ok: this._onChauffeurOk.bind(this),
        cancel: () => this._oVhdChauffeur.close()
      });
  
      this._oVhdChauffeur.getTableAsync().then(oTable => {
        oTable.setModel(this.getView().getModel());
        oTable.bindRows("/zcds_chauffeur"); // EntitySet CDS
        oTable.removeAllColumns();
  
        // ✅ Ajouter toutes les colonnes
        const aColumns = [
          { label: "ID Chauffeur", property: "Idchauffeur" },
          { label: "CIN", property: "Cin" },
          { label: "Nom Chauffeur", property: "Nomchauffeur" },
          { label: "Téléphone", property: "Telechauffeur" },
          { label: "Transporteur", property: "Nomtransporter" },
          // { label: "Matricule", property: "Matricule" }
        ];
  
        aColumns.forEach(col => {
          oTable.addColumn(new sap.ui.table.Column({
            label: new sap.m.Label({ text: col.label }),
            template: new sap.m.Text({ text: `{${col.property}}` }),
            sortProperty: col.property,
            filterProperty: col.property
          }));
        });
      });
    }
    this._oVhdChauffeur.open();
  }
  ,
  _onChauffeurOk: function (oEvent) {
    const tokens = oEvent.getParameter("tokens");
    if (tokens.length) {
      const sNom = tokens[0].getKey();
      this.byId("inNomChauffeur").setValue(sNom);
  
      const oModel = this.getView().getModel();
  
      oModel.read("/zcds_chauffeur", {
        filters: [new sap.ui.model.Filter("Nomchauffeur", sap.ui.model.FilterOperator.EQ, sNom)],
        success: (oData) => {
          if (oData.results.length > 0) {
            const oChauffeur = oData.results[0];
  
            this.byId("inCIN").setValue(oChauffeur.Cin || "");
            this.byId("inNomTransporteur").setValue(oChauffeur.Nomtransporter || "");
            // this.byId("inMatricule").setValue(oChauffeur.Matricule || "");
           
  
            // 🆕 Ajoute l'id dans un champ caché (inIdChauffeur)
            this.byId("inIdChauffeur").setValue(oChauffeur.Idchauffeur);
          }
        },
        error: () => {
          sap.m.MessageToast.show("Erreur lors du chargement des données chauffeur.");
        }
      });
    }
  
    this._oVhdChauffeur.close();
  }
  
  ,
  onOpenCinVHD: function () {
    if (!this._oVhdCin) {
      this._oVhdCin = new ValueHelpDialog({
        supportMultiselect: false,
        key: "Cin",
        descriptionKey: "Cin",
        title: "Sélectionner un CIN",
        ok: this._onCinOk.bind(this),
        cancel: () => this._oVhdCin.close()
      });
  
      this._oVhdCin.getTableAsync().then(oTable => {
        oTable.setModel(this.getView().getModel());
        oTable.bindRows("/zcds_chauffeur");
        oTable.removeAllColumns();
  
        const aColumns = [
          { label: "ID Chauffeur", property: "Idchauffeur" },
          { label: "CIN", property: "Cin" },
          { label: "Nom Chauffeur", property: "Nomchauffeur" },
          { label: "Téléphone", property: "Telechauffeur" },
          { label: "Transporteur", property: "Nomtransporter" },
          { label: "Matricule", property: "Matricule" }
        ];
  
        aColumns.forEach(col => {
          oTable.addColumn(new sap.ui.table.Column({
            label: new sap.m.Label({ text: col.label }),
            template: new sap.m.Text({ text: `{${col.property}}` }),
            sortProperty: col.property,
            filterProperty: col.property
          }));
        });
      });
    }
    this._oVhdCin.open();
  },
  _onCinOk: function (oEvent) {
    const tokens = oEvent.getParameter("tokens");
    if (tokens.length) {
      const sCin = tokens[0].getKey();
      this.byId("inCIN").setValue(sCin);
  
      const oModel = this.getView().getModel();
  
      oModel.read("/zcds_chauffeur", {
        filters: [new Filter("Cin", FilterOperator.EQ, sCin)],
        success: (oData) => {
          if (oData.results.length > 0) {
            const oChauffeur = oData.results[0];
  
            // Remplir tous les champs
            this.byId("inNomChauffeur").setValue(oChauffeur.Nomchauffeur || "");
            this.byId("inNomTransporteur").setValue(oChauffeur.Nomtransporter || "");
            this.byId("inMatricule").setValue(oChauffeur.Matricule || "");

            this.byId("inIdChauffeur").setValue(oChauffeur.Idchauffeur);
          }
        },
        error: () => {
          sap.m.MessageToast.show("Erreur lors du chargement des données.");
        }
      });
    }
  
    this._oVhdCin.close();
  }
  ,
  setChauffeurFields: function (oChauffeur) {
    this.byId("inNomChauffeur").setValue(oChauffeur.Nomchauffeur || "");
    this.byId("inCIN").setValue(oChauffeur.Cin || "");
    this.byId("inNomTransporteur").setValue(oChauffeur.Nomtransporter || "");
    this.byId("inMatricule").setValue(oChauffeur.Matricule || "");
  }
  ,
  onOpenMatriculeVHD: function () {
    if (!this._oVhdMatricule) {
      this._oVhdMatricule = new ValueHelpDialog({
        supportMultiselect: false,
        key: "Matricule",
        descriptionKey: "Matricule",
        title: "Sélectionner une Matricule",
        ok: this._onMatriculeOk.bind(this),
        cancel: () => this._oVhdMatricule.close()
      });
  
      this._oVhdMatricule.getTableAsync().then(oTable => {
        oTable.setModel(this.getView().getModel());
        oTable.bindRows("/zcds_chauffeur");
        oTable.removeAllColumns();
  
        const aColumns = [
          // { label: "ID Chauffeur", property: "Idchauffeur" },
          // { label: "CIN", property: "Cin" },
          // { label: "Nom Chauffeur", property: "Nomchauffeur" },
          // { label: "Téléphone", property: "Telechauffeur" },
          // { label: "Transporteur", property: "Nomtransporter" },
          { label: "Matricule", property: "Matricule" }
        ];
  
        aColumns.forEach(col => {
          oTable.addColumn(new sap.ui.table.Column({
            label: new sap.m.Label({ text: col.label }),
            template: new sap.m.Text({ text: `{${col.property}}` }),
            sortProperty: col.property,
            filterProperty: col.property
          }));
        });
      });
    }
    this._oVhdMatricule.open();
  },
  
  
  _onMatriculeOk: function (oEvent) {
    const tokens = oEvent.getParameter("tokens");
    if (tokens.length) {
      const sMat = tokens[0].getKey();
      this.byId("inMatricule").setValue(sMat);
  
      const oModel = this.getView().getModel();
  
      oModel.read("/zcds_chauffeur", {
        filters: [new Filter("Matricule", FilterOperator.EQ, sMat)],
        success: (oData) => {
          if (oData.results.length > 0) {
            const oChauffeur = oData.results[0];
            this.setChauffeurFields(oData.results[0]);

            this.byId("inIdChauffeur").setValue(oChauffeur.Idchauffeur);
          }
        },
        error: () => {
          sap.m.MessageToast.show("Erreur lors du chargement des données chauffeur.");
        }
      });
    }
  
    this._oVhdMatricule.close();
  }
  ,
  onOpenTransporteurVHD: function () {
    if (!this._oVhdTransporteur) {
      this._oVhdTransporteur = new ValueHelpDialog({
        supportMultiselect: false,
        key: "Nomtransporter",
        descriptionKey: "Nomtransporter",
        title: "Sélectionner un Transporteur",
        ok: this._onTransporteurOk.bind(this),
        cancel: () => this._oVhdTransporteur.close()
      });
  
      this._oVhdTransporteur.getTableAsync().then(oTable => {
        oTable.setModel(this.getView().getModel());
        oTable.bindRows("/zcds_chauffeur");
        oTable.removeAllColumns();
  
        const aColumns = [
          { label: "ID Chauffeur", property: "Idchauffeur" },
          { label: "CIN", property: "Cin" },
          { label: "Nom Chauffeur", property: "Nomchauffeur" },
          { label: "Téléphone", property: "Telechauffeur" },
          { label: "Transporteur", property: "Nomtransporter" },
          { label: "Matricule", property: "Matricule" }
        ];
  
        aColumns.forEach(col => {
          oTable.addColumn(new sap.ui.table.Column({
            label: new sap.m.Label({ text: col.label }),
            template: new sap.m.Text({ text: `{${col.property}}` }),
            sortProperty: col.property,
            filterProperty: col.property
          }));
        });
      });
    }
    this._oVhdTransporteur.open();
  },
  
  _onTransporteurOk: function (oEvent) {
    const tokens = oEvent.getParameter("tokens");
    if (tokens.length) {
      const sNomT = tokens[0].getKey();
      this.byId("inNomTransporteur").setValue(sNomT);
  
      const oModel = this.getView().getModel();
  
      oModel.read("/zcds_chauffeur", {
        filters: [new Filter("Nomtransporter", FilterOperator.EQ, sNomT)],
        success: (oData) => {
          if (oData.results.length > 0) {
            this.setChauffeurFields(oData.results[0]);
            const oChauffeur = oData.results[0];

            this.byId("inIdChauffeur").setValue(oChauffeur.Idchauffeur);
          }
        },
        error: () => {
          sap.m.MessageToast.show("Erreur lors du chargement des données chauffeur.");
        }
      });
    }
  
    this._oVhdTransporteur.close();
  }
  
  ,
  
// onPressLancer: function () {
//   const oTable = this.byId("smartTableLivraison").getTable();
//   const oSelectedItem = oTable.getSelectedItem();

//   if (!oSelectedItem) {
//     sap.m.MessageToast.show("Veuillez sélectionner une commande.");
//     return;
//   }

//   const oContext = oSelectedItem.getBindingContext();
//   const sCommandeId = oContext.getProperty("Idcommande");

//   const sIdChauffeur = this.byId("inIdChauffeur").getValue();
//   if (!sIdChauffeur) {
//     sap.m.MessageToast.show("Veuillez sélectionner un chauffeur.");
//     return;
//   }

//   const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
//   oRouter.navTo("Flux", {
//     Idcommande: sCommandeId,
//     Idchauffeur: sIdChauffeur
//   });


// }
onPressLancer: function () {
  const oTable = this.byId("smartTableLivraison").getTable();
  const oSelectedItem = oTable.getSelectedItem();

  if (!oSelectedItem) {
    sap.m.MessageToast.show("Veuillez sélectionner une commande.");
    return;
  }

  const oContext = oSelectedItem.getBindingContext();
  const sCommandeId = oContext.getProperty("Idcommande");
  const sIdChauffeur = this.byId("inIdChauffeur").getValue();

  if (!sIdChauffeur) {
    sap.m.MessageToast.show("Veuillez sélectionner un chauffeur.");
    return;
  }

  const oModel = this.getView().getModel();

  oModel.read("/ZCDS_commande", {
    filters: [new sap.ui.model.Filter("Idcommande", "EQ", sCommandeId)],
    success: (oData) => {
      let aPromises = [];
      
      oData.results.forEach((commandeLine) => {
        const sKey = oModel.createKey("ZCDS_commande", {
          Idcommande: commandeLine.Idcommande,
          Idarticle: commandeLine.Idarticle
        });

        const p = new Promise((resolve, reject) => {
          oModel.update("/" + sKey, {
            Statuscommande: "EnCours"
          }, {
            success: resolve,
            error: reject
          });
        });

        aPromises.push(p);
      });

      Promise.all(aPromises)
        .then(() => {
          sap.m.MessageToast.show("Toutes les lignes mises à jour !");
          
          // ✅ Rebind table ici
          const oSmartTable = this.byId("smartTableLivraison");
          oSmartTable.rebindTable();

          // ✅ Navigation
          const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.navTo("Flux", {
            Idcommande: sCommandeId,
            Idchauffeur: sIdChauffeur
          });
        })
        .catch(() => {
          sap.m.MessageToast.show("Erreur lors de la mise à jour.");
        });
    },
    error: () => {
      sap.m.MessageToast.show("Erreur lors de la lecture des lignes de commande.");
    }
  });
}


,

onBeforeRebindLivraison: function (oEvent) {
  const oBindingParams = oEvent.getParameter("bindingParams");
  oBindingParams.filters.push(
    new sap.ui.model.Filter("Statuscommande", sap.ui.model.FilterOperator.EQ, "Disponible")
  );
}




  
  
      });
    });
    