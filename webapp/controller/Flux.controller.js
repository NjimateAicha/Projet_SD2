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
          Idflux:         "",      
          Email:    "", 
          Datearrivee: "",
          Status: "",
          Datedepart: "",
          EcartPoids: "",
          PoidsDeclare: "",
          Dateentree: "",
          Poidsnet: "",
          Tare: "",
          Poidsbrut: "",
          Commentaire: "",
          isEcartsComputed: false 
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
 

   onEnvoyerEmail: function () {
      // 1) Sélection
      const oTable = this.byId("tblFlux");
      const oSel   = oTable.getSelectedItem();
      if (!oSel) {
        MessageToast.show("Veuillez sélectionner un flux avant d’envoyer l’email.");
        return;
      }
       const oCtx    = oSel.getBindingContext();

      const sEmail  = oCtx.getProperty("Email");    // champ email du client
      const sIdflux = oCtx.getProperty("Idflux");         // identifiant du flux
   
    //  const sEcart  = oFM.getProperty("/EcartPoids");
      const oFM    = this.getView().getModel("FluxModel");
         const sEcart       = oFM.getProperty("/EcartPoids");

  if (!oFM.getProperty("/isEcartsComputed")) {
    return sap.m.MessageToast.show("Cliquez d’abord sur « Récupérer le poids Brut ».");
  }

      // 3) Préparation de sujet et corps
        const sSubject = encodeURIComponent(`État des écarts — flux ${sIdflux}`);
     
   
        const sBody    = encodeURIComponent(
    `Bonjour,

Suite à la pesée du camion pour le flux ${sIdflux}, voici le détail complet :


1. Écart de pesée = Poids net – Poids déclaré = ${sEcart} kg  

Merci de bien vouloir vérifier ces valeurs.  
Si vous avez la moindre question, n’hésitez pas à nous contacter.

Cordialement,
    Sofalim `
  );
  

      // 4) Construction de l’URL et ouverture
      const sUrl = [
        "https://mail.google.com/mail/?view=cm&fs=1",
        "to="    + encodeURIComponent(sEmail),
        "su="    + sSubject,
        "body="  + sBody
      ].join("&");
      window.open(sUrl, "_blank");

      // 5) Message de confirmation (facultatif)
      MessageToast.show("Client mail ouvert dans un nouvel onglet.");
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
      // _onMatchedWithParams: function (oEvent) {
      //   const sIdcommande = oEvent.getParameter("arguments").Idcommande;
      //   const sIdchauffeur = oEvent.getParameter("arguments").Idchauffeur;
      
      //   this._sIdcommande = sIdcommande;
      //   this._sIdchauffeur = sIdchauffeur;
      
      //   this.byId("smartTableFlux").rebindTable(); 
      //   // ✅ recharge avec filtres dynamiques
      // }
       _onMatchedWithParams: function (oEvent) {
      const sIdcommande = oEvent.getParameter("arguments").Idcommande;
      const sIdchauffeur = oEvent.getParameter("arguments").Idchauffeur;

      // 1) Récupère le JSONModel "FluxModel"
      const oFM = this.getView().getModel("FluxModel");

   
      oFM.setData({
     
        Idcommande:       sIdcommande,
        Idchauffeur:      sIdchauffeur,
        isEcartsComputed: false   
      });

      // 3) Rebinder la table pour rafraîchir les données
      this.byId("smartTableFlux").rebindTable();
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
                oFluxModel.setProperty("/isEcartsComputed", true); 
      
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





      onPrint2:function(){
  sap.ui.core.BusyIndicator.show(0);
 const oView = this.getView();
    const oFluxModel = oView.getModel("FluxModel");
    const oTable = this.byId("tblFlux");
    const oSelectedItem = oTable.getSelectedItem();

    if (!oSelectedItem) {
        sap.m.MessageToast.show("Veuillez sélectionner un flux.");
        sap.ui.core.BusyIndicator.hide();
        return;
    }

    const oContext = oSelectedItem.getBindingContext();
    const oData = oContext.getObject(); // ✅ c’est ça qu’il faut utiliser

    const doc = new jsPDF(); // assure-toi que jsPDF est bien inclus dans ton projet
 /** ---------- IMAGE ---------- */


    // Exemple image base64 
    const imgData = "data:image/png;base64,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"; 

    // Dimensions et position de l'image
    const imgWidth = 50;  // largeur en mm
    const imgHeight = 20;  // hauteur en mm (adapter selon ton image)
    const imgX = 20;       // marge gauche
    const imgY = 10;       // marge du haut

    // Ajout de l'image
    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);






    /** ---------- ENTÊTE ---------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let idflux = oData.Idflux;
if (idflux.startsWith('F')) {
  idflux = idflux.substring(1); // Remove the first character if it's 'F'
}

doc.text("Bon de Livraison : L" + idflux, 130, 17);

    const formattedDate = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(10);
    doc.text("Le : " + formattedDate, 180, 27, { align: "right" });


    /** ---------- DONNÉES PESEE ---------- */
        let startX1 = 120;
    let startY1 = 20;
    const rowHeight1 = 5;

    doc.rect(startX1, startY1 - 8, 80, rowHeight1 * 1.5); // Cadre général

    let startX = 30;
    let startY = 45;
    const rowHeight = 10;

    doc.text("Lieu de chargement", startX - 5, startY + 40);
    doc.rect(startX - 7, startY + 42, 80, rowHeight * 2); // Cadre général
    doc.text("Sofalim", startX , startY + 52);  
    doc.text("Lieu de déchargement", startX + 90, startY + 40);
    doc.rect(startX - 7, startY + 42, 160, rowHeight * 2); // Cadre général
    doc.text(oData.Adresse || "-", startX + 90, startY + 52);

    doc.setFont("helvetica", "bold");
    doc.text("Ref client :", startX - 5, startY + 8);
    doc.text("Client :", startX - 5, startY + 18);
    doc.text("Num Bon de cmd :", startX - 5, startY + 28);

    doc.setFont("helvetica", "normal");
    doc.text(oData.Idclient || "-", startX + 45, startY + 8);  
    doc.text(oData.Nomclient || "-", startX + 45, startY + 18);
    doc.text(oData.Idcommande || "-", startX + 45, startY + 28);
  



    //     doc.setFont("helvetica", "bold");
    // doc.text("Transporteur :", startX + 92, startY + 8);
    // doc.text("Chauffeur :", startX + 92, startY + 18);
   
    // doc.setFont("helvetica", "normal");
    // doc.text(oData.Nomtransporteur || "-", startX + 135, startY + 8);  
    // doc.text(oData.Nomchauffeur || "-", startX + 135, startY + 18);
   


    doc.setFont("helvetica", "bold");
    // doc.text("Date Entrée :", startX + 100, startY + 18);
    // doc.text("Date Sortie :", startX + 100, startY + 28);

    doc.setFont("helvetica", "normal");

    // // Formattage des dates d'entrée et sortie, avec fallback
    // const dateEntree = oData.Dateentree
    //     ? new Date(oData.Dateentree).toLocaleDateString('fr-FR')
    //     : "N/A";
    // const dateSortie = oData.Datedepart
    //     ? new Date(oData.Datedepart).toLocaleDateString('fr-FR')
    //     : "N/A";

    // doc.text(dateEntree + " " + (oData.heur_entree || ""), startX + 140, startY + 18);
    // doc.text(dateSortie + " " + (oData.heur_depart || ""), startX + 140, startY + 28);


    


const cellWidths = [30, 35, 45, 30, 30];
const headers    = ["Produit","Poids","Unité","Prix"];

const unloadBottom = startY + 42 + rowHeight*2;
const headerY     = unloadBottom + 10;  // 10mm de marge

// 1) Configure une fois la couleur de fond, de contour et du texte
doc.setFillColor(173, 216, 230); // bleu clair
doc.setDrawColor(0);             // contour noir
// 1) Configure la couleur et le style AVANT la boucle
doc.setDrawColor(0);             // contour noir
doc.setTextColor(0);             // texte noir
doc.setFont("helvetica", "bold").setFontSize(9);

// 2) Redessiner chaque cellule d’en-tête avec un fond bleu clair
let x = startX + 3;
for (let i = 0; i < headers.length; i++) {
  doc.setFillColor(173, 216, 230); // Appliquer à chaque itération
  doc.rect(x, headerY, cellWidths[i], rowHeight, 'FD'); // FD = Fill puis Draw
  doc.text(headers[i], x + 2, headerY + rowHeight - 2);
  x += cellWidths[i];
}


const aItems       = oTable.getBinding("items").getContexts();
let currentY       = headerY + rowHeight;
const bottomMargin = doc.internal.pageSize.getHeight() - 30;

doc.setFont("helvetica","normal");
doc.setFontSize(9);
aItems.forEach(ctx => {
  const row = ctx.getObject();
  if (row.Idcommande === oData.Idcommande) {
    // saut de page si nécessaire
    if (currentY + rowHeight > bottomMargin) {
      doc.addPage();
      currentY = 20;
      // (optionnel : redessiner l'en-tête ici)
    }
    let cellX = startX + 3;
    const values = [
      row.Nomarticle || "-",
       row.Poidsnet  || "-",
     
      row.Qunit   || "-",
     
      row.Prixtotal    || "-"
      
    ];
    for (let i = 0; i < values.length; i++) {
      doc.rect(cellX, currentY, cellWidths[i], rowHeight);
      doc.text(String(values[i]), cellX + 2, currentY + rowHeight - 2);
      cellX += cellWidths[i];
    }
    currentY += rowHeight;
  }
});

   

     function addFooter(doc) {
            const pageHeight = doc.internal.pageSize.getHeight();
            let footerStartY = pageHeight - 25;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(0, 0, 0);
            doc.text('S.A.R.L au capital de 90.000.000 Dirhams - R.C.: 238521 - T.P.: 34792098 - I.F.: 40399318 CNSS: 8790330 - I.C.E 000059183000037', 30, footerStartY);
            footerStartY += 5;
            doc.text('Siège social: 104, Boulevard Abdelmoumen et Angle Rue Murillo - Quartier Plateau - 20100 Casablanca - Maroc', 39, footerStartY);
            footerStartY += 5;
            doc.text('Usine: Douar Joualla - Caïdat Ouled Hriz Lgharbia - Commune Sahel Ouled Hriz - Province Berrechid-Maroc - Coordonnées GPS: 33.365670 - 2.853866', 24, footerStartY);
            footerStartY += 5;
            doc.text('Correspondances: BP 270 - Had Soualem - 26400 - Maroc // Tél.: +212 5.22.03.22.22 - Fax: +212 5.22.96.36.36 - Email: contact@sofalim.ma - www.sofalim.ma', 20, footerStartY);
          }

          addFooter(doc);




          
const footerInfoHeight = 27 + 10 + (4 * 5);
const pageHeight = doc.internal.pageSize.getHeight();
var pageBottomY = pageHeight - footerInfoHeight;

    // Bloc d'informations (SOFALIM / TRANSPORT / RECEPTION)
          var sectionStartY = pageBottomY;
          var sectionHeight = 27;
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text("SOFALIM", 15, sectionStartY - 2);
          doc.setFont("helvetica", "normal");
          doc.rect(15, sectionStartY, 60, sectionHeight);
          doc.text("Nom :", 17, sectionStartY + 5);
          doc.text("Prenom :", 17, sectionStartY + 10);
          doc.text("Bascule :", 17, sectionStartY + 15);
          doc.text("Preparation :", 17, sectionStartY + 20);
          doc.text("Signature :", 17, sectionStartY + 25);
          doc.setFont("helvetica", "bold");
          doc.text("TRANSPORT", 80, sectionStartY - 2);
          doc.setFont("helvetica", "normal");
          doc.rect(80, sectionStartY, 60, sectionHeight);
          doc.text("Type :", 82, sectionStartY + 5);
          doc.text("Nom chauffeur : " + (oData.Nomchauffeur || ""), 82, sectionStartY + 10);
          doc.text("CIN : " + (oData.CIN || ""), 82, sectionStartY + 15);
          doc.text("Matricule : " + (oData.Matricule  || ""), 82, sectionStartY + 20);
          doc.text("Signature :", 82, sectionStartY + 25);
          doc.setFont("helvetica", "bold");
          doc.text("RECEPTION", 145, sectionStartY - 2);
          doc.setFont("helvetica", "normal");
          doc.rect(145, sectionStartY, 60, sectionHeight);
          doc.text("Signature Client :", 147, sectionStartY + 5);
   
 
    sap.ui.core.BusyIndicator.hide();
    doc.save("Bon_de_Livraison.pdf");
},
      
onPrin1:function(){
   sap.ui.core.BusyIndicator.show(0);
 const oView = this.getView();
    const oFluxModel = oView.getModel("FluxModel");
    const oTable = this.byId("tblFlux");
    const oSelectedItem = oTable.getSelectedItem();

    if (!oSelectedItem) {
        sap.m.MessageToast.show("Veuillez sélectionner un flux.");
        sap.ui.core.BusyIndicator.hide();
        return;
    }

    const oContext = oSelectedItem.getBindingContext();
    const oData = oContext.getObject(); // ✅ c’est ça qu’il faut utiliser

    const doc = new jsPDF(); // assure-toi que jsPDF est bien inclus dans ton projet
 /** ---------- IMAGE ---------- */


    // Exemple image base64 
    const imgData = "data:image/png;base64,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"; 

    // Dimensions et position de l'image
    const imgWidth = 50;  // largeur en mm
    const imgHeight = 20;  // hauteur en mm (adapter selon ton image)
    const imgX = 20;       // marge gauche
    const imgY = 10;       // marge du haut

    // Ajout de l'image
    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);






 
// 2) Entête du bon de préparation
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("Bon de Préparation N° : " + oData.Idflux, 120, 35);
doc.setFontSize(10);
doc.text("Le : " + new Date().toLocaleDateString('fr-FR'), 180, 20, { align: "right" });

// 3) Cadre “Données pesée”
const startX1    = 120;
const startY1    = 40;
const rowHeight1 = 5;
doc.rect(startX1, startY1, 80, rowHeight1 * 4);

// 4) Cadre “Chargement / Déchargement”
const startX     = 20;
const startY     = 70;
const rowHeight  = 10;
// Lieux
doc.text("Lieu de chargement", startX - 5,  startY + 40);
 doc.rect(startX - 7, startY + 42, 80, rowHeight * 2); // Cadre général
    doc.text("Sofalim", startX , startY + 52);  
    doc.text("Lieu de déchargement", startX + 90, startY + 40);
    doc.rect(startX - 7, startY + 42, 160, rowHeight * 2); 
doc.text(oData.Nomclient || "-", startX + 90, startY + 52);






 




// Transporteur / Véhicule / Chauffeur
doc.setFont("helvetica", "bold");
["Transporteur :", "Véhicule :", "Chauffeur :"].forEach((txt,i) =>
  doc.text(txt, startX + 5, startY + 8 + 10*i)
);
doc.setFont("helvetica", "normal");
[
  oData.Nomtransporteur || "-",
  oData.Matricule       || "-",
  oData.Nomchauffeur    || "-"
].forEach((val,i) =>
  doc.text(val, startX + 55, startY + 8 + 10*i)
);

// Dates entrée / sortie
doc.setFont("helvetica", "bold");
doc.text("Date Entrée :", startX + 100, startY + 18);
doc.text("Date Sortie  :", startX + 100, startY + 28);
doc.setFont("helvetica", "normal");
const dateEntree = oData.Dateentree
  ? new Date(oData.Dateentree).toLocaleDateString('fr-FR')
  : "N/A";
const dateSortie = oData.Datedepart
  ? new Date(oData.Datedepart).toLocaleDateString('fr-FR')
  : "N/A";
doc.text(`${dateEntree} ${oData.heur_entree||""}`, startX + 140, startY + 18);
doc.text(`${dateSortie} ${oData.heur_depart||""}`, startX + 140, startY + 28);


// après avoir tracé ton rect(startX+3, startY+42, …)



const cellWidths = [30, 35, 45, 30, 30];
const headers    = ["N° Commande","Code","Désignation","Poids","Unité"];

const unloadBottom = startY + 42 + rowHeight*2;
const headerY     = unloadBottom + 10;  // 10mm de marge

// 1) Configure une fois la couleur de fond, de contour et du texte
doc.setFillColor(173, 216, 230); // bleu clair
doc.setDrawColor(0);             // contour noir
// 1) Configure la couleur et le style AVANT la boucle
doc.setDrawColor(0);             // contour noir
doc.setTextColor(0);             // texte noir
doc.setFont("helvetica", "bold").setFontSize(9);

// 2) Redessiner chaque cellule d’en-tête avec un fond bleu clair
let x = startX + 3;
for (let i = 0; i < headers.length; i++) {
  doc.setFillColor(173, 216, 230); // Appliquer à chaque itération
  doc.rect(x, headerY, cellWidths[i], rowHeight, 'FD'); // FD = Fill puis Draw
  doc.text(headers[i], x + 2, headerY + rowHeight - 2);
  x += cellWidths[i];
}



// 5.2) Boucle sur tous les articles de la commande
const aItems       = oTable.getBinding("items").getContexts();
let currentY       = headerY + rowHeight;
const bottomMargin = doc.internal.pageSize.getHeight() - 30;

doc.setFont("helvetica","normal");
doc.setFontSize(9);
aItems.forEach(ctx => {
  const row = ctx.getObject();
  if (row.Idcommande === oData.Idcommande) {
    // saut de page si nécessaire
    if (currentY + rowHeight > bottomMargin) {
      doc.addPage();
      currentY = 20;
      // (optionnel : redessiner l'en-tête ici)
    }
    let cellX = startX + 3;
    const values = [
      row.Idcommande || "-",
      row.Idarticle   || "-",
      row.Nomarticle  || "-",
     
      row.Quantite    || "-",
       row.Qunit       || "-"
    ];
    for (let i = 0; i < values.length; i++) {
      doc.rect(cellX, currentY, cellWidths[i], rowHeight);
      doc.text(String(values[i]), cellX + 2, currentY + rowHeight - 2);
      cellX += cellWidths[i];
    }
    currentY += rowHeight;
  }
});

// 6) Pied de page
function addFooter(d) {
  const ph = d.internal.pageSize.getHeight();
  let fy = ph - 25;
  d.setFont("helvetica","normal").setFontSize(7).setTextColor(0);
  d.text('S.A.R.L au capital de 90.000.000 Dirhams - R.C.: 238521 …', 30, fy);
  fy += 5; d.text('Siège social: 104, Boulevard Abdelmoumen …', 39, fy);
  fy += 5; d.text('Usine: Douar Joualla - Caïdat Ouled Hriz …', 24, fy);
  fy += 5; d.text('Correspondances: BP 270 - Had Soualem …', 20, fy);
}
addFooter(doc);

// 7) Sauvegarde
sap.ui.core.BusyIndicator.hide();
doc.save("Bon_de_preparation.pdf");

},
      

      onPrint: function () {
    sap.ui.core.BusyIndicator.show(0);
  const oView = this.getView();
    const oFluxModel = oView.getModel("FluxModel");
    const oTable = this.byId("tblFlux");
    const oSelectedItem = oTable.getSelectedItem();

    if (!oSelectedItem) {
        sap.m.MessageToast.show("Veuillez sélectionner un flux.");
        sap.ui.core.BusyIndicator.hide();
        return;
    }

    const oContext = oSelectedItem.getBindingContext();
    const oData = oContext.getObject(); // ✅ c’est ça qu’il faut utiliser

    const doc = new jsPDF(); // assure-toi que jsPDF est bien inclus dans ton projet
 /** ---------- IMAGE ---------- */


    // Exemple image base64 
    const imgData = "data:image/png;base64,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"; 

    // Dimensions et position de l'image
    const imgWidth = 100;  // largeur en mm
    const imgHeight = 20;  // hauteur en mm (adapter selon ton image)
    const imgX = 60;       // marge gauche
    const imgY = 10;       // marge du haut

    // Ajout de l'image
    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);






    /** ---------- ENTÊTE ---------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Bon de preparation N° : " + (oData.Idflux), 20, 60);

    const formattedDate = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(10);
    doc.text("Le : " + formattedDate, 180, 60, { align: "right" });

    /** ---------- DONNÉES PESEE ---------- */
    let startX = 20;
    let startY = 70;
    const rowHeight = 10;

    doc.rect(startX, startY, 180, rowHeight * 4); // Cadre général

    doc.setFont("helvetica", "bold");
    doc.text("Véhicule :", startX + 5, startY + 8);
    doc.text("Tare :", startX + 5, startY + 18);
    doc.text("Brut :", startX + 5, startY + 28);
    doc.text("Net :", startX + 5, startY + 38);

    doc.setFont("helvetica", "normal");

    doc.text(oData.Matricule || "-", startX + 55, startY + 8);
    doc.text(oData.Tare || "0.00", startX + 55, startY + 18);
    doc.text(oData.Poidsbrut || "0.00", startX + 55, startY + 28);
    doc.text(oData.Poidsnet || "0.00", startX + 55, startY + 38);

    doc.setFont("helvetica", "bold");
    doc.text("Date Entrée :", startX + 100, startY + 18);
    doc.text("Date Sortie :", startX + 100, startY + 28);

    doc.setFont("helvetica", "normal");

    // Formattage des dates d'entrée et sortie, avec fallback
    const dateEntree = oData.Dateentree
        ? new Date(oData.Dateentree).toLocaleDateString('fr-FR')
        : "N/A";
    const dateSortie = oData.Datedepart
        ? new Date(oData.Datedepart).toLocaleDateString('fr-FR')
        : "N/A";

    doc.text(dateEntree + " " + (oData.heur_entree || ""), startX + 140, startY + 18);
    doc.text(dateSortie + " " + (oData.heur_depart || ""), startX + 140, startY + 28);

/** ---------- ARTICLES ---------- */
let articlesY = startY + rowHeight * 4;
//doc.rect(startX, articlesY, 50, rowHeight);
//doc.rect(startX + 50, articlesY, 130, rowHeight);
doc.setFont("helvetica", "bold");
doc.text("Article(s)", startX + 5, articlesY + 7);
doc.setFont("helvetica", "normal");

let currentY = articlesY + rowHeight;
const seenArticles = {};
const aItems = oTable.getBinding("items").getContexts();
const sIdcommande = oData.Idcommande;


let articleCounter = 1; // ← compteur initialisé

// On parcourt toutes les lignes du tableau avec le même Idcommande
aItems.forEach(ctx => {
    const row = ctx.getObject();
    if (row.Idcommande === sIdcommande) {
        const articleName = row.Nomarticle || row.Idarticle || "Article inconnu";
        const trimmed = articleName.trim();
        if (trimmed && !seenArticles[trimmed.toLowerCase()]) {
            seenArticles[trimmed.toLowerCase()] = true;

             const textWithNumber = `${articleCounter}. ${trimmed}`; // ← numérotation ici
            articleCounter++;


            const lines = doc.splitTextToSize(textWithNumber, 120);
            lines.forEach((line) => {
                if (currentY + rowHeight > 280) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(line, startX + 55, currentY);
                currentY += rowHeight;
            });
        }
    }
});

// Redessiner les cadres en fonction de la hauteur réelle
doc.rect(startX, articlesY, 50, currentY - articlesY);
doc.rect(startX + 50, articlesY, 130, currentY - articlesY);

    sap.ui.core.BusyIndicator.hide();
    doc.save("Bon_de_pesee.pdf");
}






      
        
      });
    });
    
    