let options_number = 2;
let add_option_row;

$("#add_option").on("mousedown focus click", function() {
    options_number++;
    $(this).parent().before(`<div class="form-group-vertical-item"><input type="text" class="form-control" name="options" placeholder="Option ${options_number}..."></div>`);
    $("input[name='options']:last-child").focus();
    if (options_number === 8) add_option_row = $(this).parent().detach();
    return false;
});

$("#form-poll").on("keydown", "input[name='options']", function(e) {
    if (e.which === 8 && options_number > 2 && $(this).val() === "") {
        $(this).parent().prev().children().focus();

        $(this).parent().remove();
        options_number--;
        $("input[name='options']").each(function(index) {
            $(this).attr("placeholder", `Option ${index + 1}...`);
        });
        add_option_row.appendTo(".form-group-vertical");
        return false;
    }
}).on("submit", function(e) {
    $("#flash").text("").hide();
    $("#submit").prop('disabled', true).val("Creating...");
    let custom_url = $("#custom_url").val().trim();
    let error = false;
    let data = {
        title: $("#title").val().trim(),
        options: $("input[name=options]").map(function() {return $(this).val();}).get().filter(option => option.trim().length > 0)    };

    if (data.title.length < 1) {
        $("#flash").append("<p>The title should have at least 1 non-empty symbol</p>");
        error = true;
    }
    if (data.options.length < 2) {
        $("#flash").append("<p>Please, fill in at least 2 options</p>");
        error = true;
    }
    if (custom_url !== '') {
        if (custom_url.match(/^[0-9a-zA-Z-_]{3,64}$/) === null) {
            $("#flash").append("<p>Custom address can only consist of latin letters, digits, underscores and dashes, and should be from 3 to 64 symbols");
            error = true;
        } else if (custom_url.match(/^[0-9a-f]{24}$/) !== null) {
            $("#flash").append("<p>Can't use such custom address</p>");
            error = true;
        } else {
            data.custom_url = custom_url;
        }
    }

    if (error) {
        $("#flash").show();
        $("#submit").prop('disabled', false).val("Create");
        return false;
    }
    console.log(data);
    $.post("/api/create", JSON.stringify(data), response => {
        if (response.success === true) {
            window.location.href = response.short + "/";
        } else {
            $("#flash").text("Error:").append(`<p>${response.error}</p>`).show();
            $("#submit").prop('disabled', false).val("Create");
        }
    }, 'json');
    
    return false;
});

$.getJSON("/api/latest", data => {
    $("#latest-polls p").remove();
    if (data.polls.length === 0) {
        $("#latest-polls").append("<p>There are none... Be the first one to create!</p>");
    } else {
        $(data.polls.map(poll => `<p><a href="${poll.id}/">${poll.title}</a></p>`).join("")).appendTo("#latest-polls");
    }
});