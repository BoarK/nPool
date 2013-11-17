// object type function prototype
var SubModuleContext = function () {

    // private function
    this.checkModuleContext = function (workParam) {

        return {
            "workParam": workParam,
            "__dirname": __dirname,
            "__filename": __filename,
            "console.log": (typeof console.log == "function")
        };
    };
};

// replicate node.js module loading system
module.exports = SubModuleContext;