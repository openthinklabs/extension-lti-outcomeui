<div class="highlighter-container">
    <div class="highlighter-tray">
        <span class="highlighter-title">{{label}}</span>
        <div class="items">
            {{#each colors}}
                <div class="color-item">
                    <input class="color-button {{this}}-color" data-color="{{this}}" type="button"/>
                </div>
            {{/each}}
            <button class="icon icon-eraser" />
        </div>
    </div>
</div>
