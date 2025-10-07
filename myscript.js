 $(document).ready(function() {
    function checkWidth() {
        var windowSize = $(window).width();

        if (windowSize < 700) {
            // Hide the links if the window width is less than 700px
            $('.navbar').addClass('hidden');
        } else {
            // Show the links if the window width is greater than or equal to 700px
            $('.navbar').removeClass('hidden');
        }
    }

    // Execute on load
    checkWidth();

    // Bind event listener
    $(window).resize(checkWidth);
});