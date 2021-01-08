<div class="highlighter-container">
    <div class="highlighter-tray">
        <span class="highlighter-title">{{label}}</span>
        <div class="items">
            {{#each colors}}
                <div class="color-item">
                    <button class="color-button {{@key}}" name="{{@key}}">
                        <span class="counter"></span>
                    </button>
                </div>
            {{/each}}
            <button class="icon icon-eraser"></button>
        </div>
    </div>
</div>
