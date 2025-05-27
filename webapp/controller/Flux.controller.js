sap.ui.define([
    "sap/ui/core/mvc/Controller"
  ], function(Controller) {
    return Controller.extend("projectsd2.controller.Flux", {
      
   

        
      onInit: function () {
        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("Flux").attachPatternMatched(this._onMatched, this);
        oRouter.getRoute("Flux").attachPatternMatched(this._onMatchedWithParams, this);
        // oRouter.getRoute("FluxSimple").attachPatternMatched(this._onMatchedWithoutParams, this);
        
        // ✅ Initialise le modèle JSON pour lier les données
        const oFluxModel = new sap.ui.model.json.JSONModel({
          Datearrivee: "",
          Status: "",
          Datedepart: "",
          EcartPoids: "",
          PoidsDeclare: "",
          Dateentree: "",
          Poidsnet: "",
          Tare: "",
          Poidsbrut: "",
          Commentaire: ""
        });
      
        this.getView().setModel(oFluxModel, "FluxModel");
         const sLogoUrl = sap.ui.require.toUrl("projectsd2") + "/images/logo.png";
  fetch(sLogoUrl)
    .then(r => r.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => { this._imgLogo = reader.result; resolve(); };
      reader.readAsDataURL(blob);
    }))
    .catch(console.error);
      }
      
, 


_onMatched: function (oEvent) {
  const sIdcommande = oEvent.getParameter("arguments").Idcommande;
  const sIdchauffeur = oEvent.getParameter("arguments").Idchauffeur;

  this._sIdcommande = sIdcommande;
  this._sIdchauffeur = sIdchauffeur;

  const oModel = this.getView().getModel();
  const insertedArticles = new Set();

  // ✅ Étape 1 : Générer UN SEUL idflux
  this._generateNextIdFlux(async (sNextId) => {
    oModel.read("/ZCDS_commande", {
      filters: [new sap.ui.model.Filter("Idcommande", "EQ", sIdcommande)],
      success: async (oData) => {
        const aArticles = oData.results;

        for (const item of aArticles) {
          const idArticle = item.Idarticle;

          if (!idArticle || insertedArticles.has(idArticle)) {
            continue;
          }

          insertedArticles.add(idArticle);

          const exists = await new Promise((resolve, reject) => {
            oModel.read("/ZCDS_flux", {
              filters: [
                new sap.ui.model.Filter("Idcommande", "EQ", sIdcommande),
                new sap.ui.model.Filter("Idchauffeur", "EQ", sIdchauffeur),
                new sap.ui.model.Filter("Idarticle", "EQ", idArticle)
              ],
              success: (res) => resolve(res.results.length > 0),
              error: reject
            });
          });

          if (!exists) {
            await new Promise((resolve, reject) => {
              const oPayload = {
                Idflux: sNextId, // ✅ Même ID pour tous
                Idcommande: sIdcommande,
                Idchauffeur: sIdchauffeur,
                Idarticle: idArticle
              };

              oModel.create("/ZCDS_flux", oPayload, {
                success: resolve,
                error: reject
              });
            });
          }
        }

        // sap.m.MessageToast.show("✅ Flux insérés avec même ID.");
        this.byId("smartTableFlux").rebindTable();
      },
      error: () => {
        sap.m.MessageBox.error("❌ Erreur lecture des articles commande.");
      }
    });
  });
},
      
      
      _generateNextIdFlux: function (callback) {
        const oModel = this.getView().getModel();
      
        oModel.read("/ZCDS_flux", {
          success: function (oData) {
            let max = 0;
            oData.results.forEach((item) => {
              const match = item.Idflux && item.Idflux.match(/\d+$/);
              if (match) {
                const num = parseInt(match[0], 10);
                if (num > max) max = num;
              }
            });
      
            const nextId = "F" + String(max + 1).padStart(4, '0'); // Exemple : F000003
            callback(nextId);
          },
          error: function () {
            sap.m.MessageBox.error("❌ Erreur lors de la génération de l'ID");
          }
        });
      }
      ,
      _onMatchedWithParams: function (oEvent) {
        const sIdcommande = oEvent.getParameter("arguments").Idcommande;
        const sIdchauffeur = oEvent.getParameter("arguments").Idchauffeur;
      
        this._sIdcommande = sIdcommande;
        this._sIdchauffeur = sIdchauffeur;
      
        this.byId("smartTableFlux").rebindTable(); // ✅ recharge avec filtres dynamiques
      }
      ,      
    
 
    
      onArriveeCamion: function () {
        const oView = this.getView();
        const oModel = oView.getModel();
        const oTable = this.byId("tblFlux");
        oModel.setUseBatch(false);
      
        const oSelectedItem = oTable.getSelectedItem();
        if (!oSelectedItem) {
          sap.m.MessageToast.show("Veuillez sélectionner un flux.");
          return;
        }
      
        const oContext = oSelectedItem.getBindingContext();
        const sIdcommande = oContext.getProperty("Idcommande");
        const sIdchauffeur = oContext.getProperty("Idchauffeur");
      
        const oCurrentDate = new Date();
        // const sDateISO = oCurrentDate.toISOString().split("T")[0];
        const sDateTimeISO = oCurrentDate.toISOString().slice(0, 16).replace("T", " "); // ex: "2025-05-20 14:22"

      
        const oFluxModel = oView.getModel("FluxModel");
        oFluxModel.setProperty("/Datearrivee", sDateTimeISO);
        oFluxModel.setProperty("/Status", "Arrivé");
      
        const aItems = oTable.getBinding("items").getContexts();
        const aUpdates = [];
      
        aItems.forEach((ctx) => {
          const oData = ctx.getObject();
      
          // ✅ Vérifie que toutes les clés sont bien présentes
          if (
            oData.Idcommande === sIdcommande &&
            oData.Idchauffeur === sIdchauffeur &&
            oData.Idflux &&
            oData.Idarticle
          ) {
            const sPath = `/ZCDS_flux(Idflux='${oData.Idflux}',Idcommande='${oData.Idcommande}',Idchauffeur=${oData.Idchauffeur},Idarticle='${oData.Idarticle}')`;
            console.log("➡️ Mise à jour :", sPath);
      
            aUpdates.push(
              new Promise((resolve, reject) => {
                oModel.update(
                  sPath,
                  {
                    Datearrivee: sDateTimeISO,
                    Status: "Arrivé"
                  },
                  {
                    success: resolve,
                    error: reject
                  }
                );
              })
            );
          } else {
            console.log("⛔ Clé manquante pour mise à jour :", oData);
          }
        });
      
        Promise.all(aUpdates)
          .then(() => {
            sap.m.MessageToast.show("✔️ Tous les flux de la commande ont été mis à jour.");
            this.byId("smartTableFlux").rebindTable();
          })
          .catch(() => {
            sap.m.MessageBox.error("❌ Erreur pendant la mise à jour de certains flux.");
          });
      }
      
      
      
      
      ,
  
      onSaveInfo: function () {
        const oView = this.getView();
        const oModel = oView.getModel();
        const oFluxModel = oView.getModel("FluxModel");
        const oTable = this.byId("tblFlux");
        oModel.setUseBatch(false);
      
        const oSelectedItem = oTable.getSelectedItem();
        if (!oSelectedItem) {
          sap.m.MessageToast.show("Veuillez sélectionner un flux.");
          return;
        }
      
        const oContext = oSelectedItem.getBindingContext();
        const oData = oContext.getObject();
      
        const sIdflux = oData.Idflux;
        const sIdcommande = oData.Idcommande;
        const sIdchauffeur = oData.Idchauffeur;
      
        const aItems = oTable.getBinding("items").getContexts();
        const aUpdates = [];
      
        aItems.forEach((ctx) => {
          const row = ctx.getObject();
      
          if (
            row.Idflux === sIdflux &&
            row.Idcommande === sIdcommande &&
            row.Idchauffeur === sIdchauffeur
          ) {
            const sPath = `/ZCDS_flux(Idflux='${row.Idflux}',Idcommande='${row.Idcommande}',Idchauffeur=${row.Idchauffeur},Idarticle='${row.Idarticle}')`;
      
           
             const Poidsbrut = parseFloat(oFluxModel.getProperty("/Poidsbrut")) || 0;
             const tare = parseFloat(row.Tare) || 0;
             const Poidsnet = Poidsbrut - tare;
           
            const Datedepart = oFluxModel.getProperty("/Datedepart") || null;
            const PoidsbrutVal = oFluxModel.getProperty("/Poidsbrut");
            const statutFinal = Datedepart ? "Terminé" : "Chargement";
            




              const oDataToUpdate = {
                Poidsbrut: Poidsbrut.toFixed(2),     // ← converti en string propre ex: "33.00"
                Poidsnet: Poidsnet.toFixed(2),       // ← idem
                Datedepart: oFluxModel.getProperty("/Datedepart") || null,
                Status: "Chargement",
                Status: statutFinal,
                 Commentaire: oFluxModel.getProperty("/Commentaire") || ""
              };
   

              
            
      
            console.log("➡️ Mise à jour :", sPath);
            console.log("📦 Payload envoyé :", oDataToUpdate);
      
            aUpdates.push(
              new Promise((resolve, reject) => {
                oModel.update(sPath, oDataToUpdate, {
                  success: resolve,
                  error: reject
                });
              })
            );
          }
        });
      
        Promise.all(aUpdates)
          .then(() => {
            sap.m.MessageToast.show("✔️ Poids brut, net et date de départ enregistrés.");
            this.byId("smartTableFlux").rebindTable();
          })
          .catch(() => {
            sap.m.MessageBox.error("❌ Erreur lors de l'enregistrement.");
          });
      } 
     ,
     onGetPoidsTare: function () {
      const oModel = this.getView().getModel();
      const oFluxModel = this.getView().getModel("FluxModel");
      const oTable = this.byId("tblFlux");
      const oSelectedItem = oTable.getSelectedItem();
    
      if (!oSelectedItem) {
        sap.m.MessageToast.show("Veuillez sélectionner un flux.");
        return;
      }
    
      const oContext = oSelectedItem.getBindingContext();
      const oData = oContext.getObject();
    
      const sIdflux = oData.Idflux;
      const sIdcommande = oData.Idcommande;
      const sIdchauffeur = oData.Idchauffeur;
    
      // Lire depuis Bascule
      oModel.read("/ZCDS_Basculee2", {
        sorters: [new sap.ui.model.Sorter("Idbascule", true)],
        success: (oDataBascule) => {
          if (oDataBascule.results.length === 0) {
            sap.m.MessageBox.warning("⚠️ Aucune donnée dans la bascule.");
            return;
          }
    
          const oLastEntry = oDataBascule.results[0];
          const oNow = new Date();
          const sDateTime = oNow.toISOString().slice(0, 16).replace("T", " ");
    
         
          oFluxModel.setProperty("/Tare", parseFloat(oLastEntry.PoidsTare) || 0);


          oFluxModel.setProperty("/Dateentree", sDateTime);
          oFluxModel.setProperty("/Status", "Chargement"); // ✅ corriger affichage haut
    
          // ✅ Mettre à jour visuellement le champ status (facultatif si lié)
          this.byId("_IDGenSelect").setSelectedKey("EnCours"); // si clé = EnCours
    
          // ✅ Mettre à jour dans toutes les lignes du flux
          const aItems = oTable.getBinding("items").getContexts();
          const aUpdates = [];
    
          aItems.forEach((ctx) => {
            const row = ctx.getObject();
            if (
              row.Idflux === sIdflux &&
              row.Idcommande === sIdcommande &&
              row.Idchauffeur === sIdchauffeur
            ) {
              const sPath = `/ZCDS_flux(Idflux='${row.Idflux}',Idcommande='${row.Idcommande}',Idchauffeur=${row.Idchauffeur},Idarticle='${row.Idarticle}')`;
              aUpdates.push(
                new Promise((resolve, reject) => {
                  oModel.update(sPath, {
                    Tare: oLastEntry.PoidsTare,
                    Dateentree: sDateTime,
                    Status: "Chargement",
                     Commentaire: oFluxModel.getProperty("/Commentaire") || ""
                  }, {
                    success: resolve,
                    error: reject
                  });
                })
              );
            }
          });
    
          Promise.all(aUpdates)
            .then(() => {
              sap.m.MessageToast.show("✔️ Poids Tare + Date entrée enregistrés.");
              this.byId("smartTableFlux").rebindTable();
            })
            .catch(() => {
              sap.m.MessageBox.error("❌ Erreur lors de la mise à jour du poids tare.");
            });
        },
        error: () => {
          sap.m.MessageBox.error("❌ Erreur lors de l'accès à la table bascule.");
        }
      });
    }
      ,
     
      onGetPoidsBrut: function () {
        const oModel = this.getView().getModel();
        const oFluxModel = this.getView().getModel("FluxModel");
        const oTable = this.byId("tblFlux");
        const oSelectedItem = oTable.getSelectedItem();
      
        if (!oSelectedItem) {
          sap.m.MessageToast.show("Veuillez sélectionner un flux.");
          return;
        }
      
        const oContext = oSelectedItem.getBindingContext();
        const oData = oContext.getObject();
        const sIdcommande = oData.Idcommande;
        const selectedArticle = oData.Idarticle; // ✅ AJOUTÉ ICI
      
        oModel.read("/ZCDS_Basculee2", {
          sorters: [new sap.ui.model.Sorter("Idbascule", true)],
          success: (oDataBascule) => {
            if (oDataBascule.results.length === 0) {
              sap.m.MessageBox.warning("⚠️ Aucune donnée dans la bascule.");
              return;
            }
      
            const oLastEntry = oDataBascule.results[0];
            const sDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
            const tare = parseFloat(oFluxModel.getProperty("/Tare")) || 0;
            const Poidsbrut = parseFloat(oLastEntry.Poidsbrut) || 0;
            const Poidsnet = Poidsbrut - tare;
      
            if (tare > Poidsbrut) {
              sap.m.MessageBox.warning("⚠️ Le poids tare est supérieur au poids brut.");
            }
            oModel.read(`/ZCDS_commande?$filter=Idcommande eq '${sIdcommande}'`, {

           
              success: (oCommandeData) => {
                
               
                let totalQuantite = 0;

               

          oCommandeData.results.forEach((item) => {
            if (item.Idcommande === sIdcommande) {
              totalQuantite += parseFloat(item.Quantite) || 0;
            }
          });


                

      
                const ecartPoids = Poidsnet - totalQuantite;
      
                // ✅ Mise à jour du modèle
                oFluxModel.setProperty("/Poidsbrut", Poidsbrut);
                oFluxModel.setProperty("/Poidsnet", Poidsnet);
                oFluxModel.setProperty("/PoidsDeclare", totalQuantite);
                oFluxModel.setProperty("/EcartPoids", ecartPoids);
      
                sap.m.MessageToast.show("✔️ Données mises à jour (Poids Brut + Quantité totale).");
              },
              error: () => {
                sap.m.MessageBox.error("❌ Erreur lors de la lecture de la commande.");
              }
            });
          },
          error: () => {
            sap.m.MessageBox.error("❌ Erreur lors de la lecture de la bascule.");
          }
        });
      }
      
      
      
      ,
      onDepartCamion: function () {
        const oView = this.getView();
        const oModel = oView.getModel();
        const oFluxModel = oView.getModel("FluxModel");
        const oTable = this.byId("tblFlux");
      
        const oSelectedItem = oTable.getSelectedItem();
        if (!oSelectedItem) {
          sap.m.MessageToast.show("Veuillez sélectionner un flux.");
          return;
        }
      
        const oContext = oSelectedItem.getBindingContext();
        const oData = oContext.getObject();
      
        const sIdflux = oData.Idflux;
        const sIdcommande = oData.Idcommande;
        const sIdchauffeur = oData.Idchauffeur;
      
        const sDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
        oFluxModel.setProperty("/Datedepart", sDateTime); // ✅ affichage en haut
        oFluxModel.setProperty("/Status", "Terminé");
      
        const aItems = oTable.getBinding("items").getContexts();
        const aUpdates = [];
      
        aItems.forEach((ctx) => {
          const row = ctx.getObject();
      
          if (
            row.Idflux === sIdflux &&
            row.Idcommande === sIdcommande &&
            row.Idchauffeur === sIdchauffeur
          ) {
            const sPath = `/ZCDS_flux(Idflux='${row.Idflux}',Idcommande='${row.Idcommande}',Idchauffeur=${row.Idchauffeur},Idarticle='${row.Idarticle}')`;
      
            const oDataToUpdate = {
              Datedepart: sDateTime,
              Status: "Terminé",
              Commentaire: oFluxModel.getProperty("/Commentaire") || ""
            };
      
            aUpdates.push(
              new Promise((resolve, reject) => {
                oModel.update(sPath, oDataToUpdate, {
                  success: resolve,
                  error: reject
                });
              })
            );
          }
        });
      
        Promise.all(aUpdates)
          .then(() => {
            this.byId("_IDGenSelect").setSelectedKey("Terminé");
            this.byId("smartTableFlux").rebindTable();
            sap.m.MessageToast.show("✔️ Départ camion : date et statut enregistrés.");
          })
          .catch(() => {
            sap.m.MessageBox.error("❌ Erreur lors de la mise à jour du départ camion.");
          });
      }
      
      ,     
      onCancelInfo: function () {
        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("Dashboard");
      }
      
      ,
      onBeforeRebindTable: function (oEvent) {
        const oBindingParams = oEvent.getParameter("bindingParams");
      
        // Injecte les filtres dynamiquement
        if (this._sIdcommande && this._sIdchauffeur) {
          oBindingParams.filters = [
            new sap.ui.model.Filter("Idcommande", "EQ", this._sIdcommande),
            new sap.ui.model.Filter("Idchauffeur", "EQ", this._sIdchauffeur)
          ];
        } else {
          // Par sécurité, on vide les résultats si pas de filtre
          oBindingParams.filters = [new sap.ui.model.Filter("Idcommande", "EQ", "__NONE__")];
        }
      },
      
onViewBonPesee: function () {

},






      
        
      });
    });
    
    