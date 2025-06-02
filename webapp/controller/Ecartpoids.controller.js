sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("projectsd2.controller.Ecartpoids", {
onInit: function () {
  const oModel = this.getOwnerComponent().getModel(); // OData
  const aFinalData = [];

  oModel.read("/ZCDS_flux", {
    success: (oFluxData) => {
      const aFlux = oFluxData.results;

      oModel.read("/ZCDS_commande", {
        success: (oCmdData) => {
          const aCmds = oCmdData.results;

          aFlux.forEach((flux) => {
            if (flux.Status === "Terminé") {
              const totalDeclare = aCmds
                .filter(cmd => cmd.Idcommande === flux.Idcommande)
                .reduce((sum, item) => sum + parseFloat(item.Quantite || 0), 0);

              const poidsNet = parseFloat(flux.Poidsnet || 0);
              const ecart = poidsNet - totalDeclare;

              aFinalData.push({
                Idflux: flux.Idflux,
                Poidsnet: poidsNet,
                PoidsDeclare: totalDeclare,
                EcartPoids: ecart,
                Email: flux.Email || "",
                Status: flux.Status
              });
            }
          });

          console.log("✅ Données calculées : ", aFinalData); // <== ajoute ça !

          const oJsonModel = new JSONModel({ Ecarts: aFinalData });
          this.getView().setModel(oJsonModel, "ecartsModel"); // <== nom important ici !
        },
        error: () => console.error("❌ Erreur de lecture commandes")
      });
    },
    error: () => console.error("❌ Erreur de lecture flux")
  });
}
,

    getEcartState: function (fEcart) {
      return Math.abs(fEcart) > 0.1 ? "Error" : "Success";
    },
onEnvoyerEmail: function () {
  const oTable = this.byId("tblEcarts");
  const oSel = oTable.getSelectedItem();

  if (!oSel) {
    MessageToast.show("Veuillez sélectionner un flux avant d’envoyer l’email.");
    return;
  }

  const oCtx = oSel.getBindingContext("ecartsModel"); // ✅ modèle local précisé
  const sEmail = oCtx.getProperty("Email");
  const sIdflux = oCtx.getProperty("Idflux");
  const sEcart = oCtx.getProperty("EcartPoids");

  if (!sEmail || !sEmail.includes("@")) {
    MessageToast.show("Adresse email non valide ou manquante.");
    return;
  }

  const sSubject = encodeURIComponent(`État des écarts — flux ${sIdflux}`);
  const sBody = encodeURIComponent(
    `Bonjour,

Suite à la pesée du camion pour le flux ${sIdflux}, voici le détail complet :

1. Écart de pesée = Poids net – Poids déclaré = ${sEcart} kg  

Merci de bien vouloir vérifier ces valeurs.  
Si vous avez la moindre question, n’hésitez pas à nous contacter.

Cordialement,
Sofalim`
  );

  const sUrl = [
    "https://mail.google.com/mail/?view=cm&fs=1",
    "to=" + encodeURIComponent(sEmail),
    "su=" + sSubject,
    "body=" + sBody
  ].join("&");

  window.open(sUrl, "_blank");
  MessageToast.show("Ouverture de l'email dans un nouvel onglet.");
}


  });
});
