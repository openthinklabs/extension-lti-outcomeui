<div class="highlighter-container">
    <div class="highlighter-tray">
        <span class="highlighter-title">{{label}}</span>
        <div class="items">
            {{#each colors}}
                <div class="color-item">
                    <button class="color-button {{this}}" name="{{this}}">
                        <span class="counter"></span>
                    </button>
                </div>
            {{/each}}
            <button type="button" class="highlighter-eraser">
                <svg class="icon medium svelte-12ux26s" viewBox="0 0 16 16" aria-hidden="false"><title>Eraser icon</title><path d="M14.73 5l-3.54-3.57a2 2 0 00-2.83 0L.59 9.21a2 2 0 000 2.79l3 3h11.07v-1H8.52l6.21-6.21a2 2 0 000-2.79zM14 7.09l-3.53 3.53-4.93-4.95 3.53-3.53a1 1 0 011.42 0L14 5.67a1 1 0 010 1.42z"></path></svg>
            </button>
            <a class="highlighter-clear-all-btn" href="#">{{clearAllButtonText}}</a>
        </div>
    </div>
</div>
<div class="highlighter-offset"></div>
