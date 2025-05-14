/*global QUnit*/

sap.ui.define([
	"projectsd2/controller/projetsd2.controller"
], function (Controller) {
	"use strict";

	QUnit.module("projetsd2 Controller");

	QUnit.test("I should test the projetsd2 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
