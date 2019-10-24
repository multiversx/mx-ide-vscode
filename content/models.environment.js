var EnvironmentModel = Backbone.Model.extend({
    initialize: function () {
        var self = this;

        app.events.on("extension-message:refreshEnvironment", function (payload) {
            self.set(payload);
        });

        app.events.on("extension-message:download", function (payload) {
            self.set("downloading", payload);
        });
    }
});
