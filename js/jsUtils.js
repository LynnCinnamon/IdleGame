document.addEventListener('mousedown', function(e) {
    // If mousedown event is fired from .handler, toggle flag to true
    if (e.target.classList.contains("noselect")) {
        e.preventDefault();
    }
});