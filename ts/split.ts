//Function ensures that we encapsulate it as to not interfere with other JS libs or scripts
(function(){
    var currentHandler = undefined;
    var currentWrapper = undefined;
    var currentBoxA = undefined;
    var isHandlerDragging = false;

    document.addEventListener('mousedown', function(e) {
        // If mousedown event is fired from .handler, toggle flag to true
        if (e.target instanceof Element) {
        if (e.target.classList.contains("splitter")
            && !e.target.classList.contains("disabled")) {
            e.preventDefault();
            isHandlerDragging = true;
            currentHandler = e.target;
            currentWrapper = currentHandler.closest('.wrapper');
            currentBoxA = currentWrapper.querySelector('.box');
        }
        }
    });

    document.addEventListener('mousemove', function(e) {
        // Don't do anything if dragging flag is false
        if (!isHandlerDragging) {
            return false;
        }

        e.preventDefault();

        // Get offset
        var containerOffsetLeft = currentWrapper.offsetLeft;
        var containerOffsetTop = currentWrapper.offsetTop;

        // Get x-coordinate of pointer relative to container
        var pointerRelativeXpos = e.clientX - containerOffsetLeft;
        var pointerRelativeYpos = e.clientY - containerOffsetTop;

        // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
        var boxAminWidth = 40;

        // Resize box A
        // * 8px is the left/right spacing between .handler and its inner pseudo-element
        // * Set flex-grow to 0 to prevent it from growing

        if(currentWrapper.classList.contains("column"))
        {
            currentBoxA.style.height = (Math.max(boxAminWidth, pointerRelativeYpos - 8) / currentBoxA.parentElement.clientHeight * 100) + '%';
        }
        else
        {
            currentBoxA.style.width = (Math.max(boxAminWidth, pointerRelativeXpos - 8) / currentBoxA.parentElement.clientWidth * 100) + '%';
        }
        currentBoxA.style.flexGrow = 0;
    });

    document.addEventListener('mouseup', function(e) {
        // Turn off dragging flag when user mouse is up
        isHandlerDragging = false;
        currentHandler = undefined;
        currentWrapper = undefined;
        currentBoxA = undefined;
    });
})()