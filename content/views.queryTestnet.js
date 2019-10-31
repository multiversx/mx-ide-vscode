var QueryTestnetView = Backbone.View.extend({
    events: {
        "click .btn-submit": "onClickSubmit"
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.onModelChange);
        this.render();
    },

    onModelChange: function () {
        this.render();
    },
    
    render: function() {
        var data = this.model.toJSON();
        var valueResponse = data.valueResponse;
        var prettyRawRequest = JSON.stringify(data.rawRequest || {}, null, 4);
        var prettyRawResponse = JSON.stringify(data.rawResponse || {}, null, 4);
        this.$el.find(".raw-request").text(prettyRawRequest);
        this.$el.find(".raw-response").text(prettyRawResponse);

        if (valueResponse) {
            this.$el.find(".value-response").removeClass("d-none").text(valueResponse);
        } else {
            this.$el.find(".value-response").addClass("d-none").empty();
        }
    },

    onClickSubmit: function () {
        var queryParams = new QueryTestnetParams({
            proxyUrl: this.$el.find("[name='ProxyUrl']").val(),
            scAddress: this.$el.find("[name='ScAddress']").val(),
            functionName: this.$el.find("[name='FunctionName']").val(),
            resultType: this.$el.find("[name='ResultType']").val(),
            args: this.getArgs()
        });

        this.clearValidationErrors();

        if (queryParams.isValid()) {
            this.model.sendQuery(queryParams);
        } else {
            this.displayValidationErrors(queryParams.validationError);
        }
    },

    clearValidationErrors: function () {
        this.$el.find(".validation-errors-container").addClass("d-none").empty();
    },

    displayValidationErrors: function (validationError) {
        this.$el.find(".validation-errors-container").removeClass("d-none").text(validationError);
    },

    getArgs: function () {
        var argsString = this.$el.find("[name='Args']").val();
        var args = argsString.split("\n");
        return args;
    }
});