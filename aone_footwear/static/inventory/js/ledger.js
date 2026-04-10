(function () {

const form = document.getElementById("ledger_filters");

/* AUTO SUBMIT FILTERS */
["led_brand","led_category","led_section","led_size","led_supplier"]
.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => form.submit());
});

/* EXPAND / COLLAPSE */
document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("toggle-details")) return;

    const btn = e.target;
    const productId = btn.dataset.productId;
    const row = document.getElementById(`details-${productId}`);
    const content = document.getElementById(`details-content-${productId}`);

    if (!row || !content) return;

    if (row.style.display === "table-row") {
        row.style.display = "none";
        btn.textContent = "+";
        return;
    }

    row.style.display = "table-row";
    btn.textContent = "-";

    if (content.dataset.loaded) return;

    fetch(`/ledger/product-details/${productId}/`)
        .then(r => r.json())
        .then(d => {
            const profit = parseFloat(d.profit);
            const cls = profit > 0 ? "text-success" : profit < 0 ? "text-danger" : "";
            content.innerHTML = `
                <table class="table table-sm mb-0">
                    <tr><th>Last Purchase</th><td>${d.purchase_date || "-"}</td></tr>
                    <tr><th>Last Sale</th><td>${d.sale_date || "-"}</td></tr>
                    <tr><th>Profit</th><td class="${cls}">₹ ${profit.toFixed(2)}</td></tr>
                </table>
            `;
            content.dataset.loaded = "1";
        })
        .catch(() => {
            content.innerHTML = "<span class='text-danger'>Failed to load</span>";
        });
});

/* EXPAND / COLLAPSE ALL */
document.getElementById("expandAll")?.addEventListener("click", () => {
    document.querySelectorAll(".toggle-details").forEach(btn => btn.click());
});

document.getElementById("collapseAll")?.addEventListener("click", () => {
    document.querySelectorAll(".toggle-details").forEach(btn => {
        const row = document.getElementById(`details-${btn.dataset.productId}`);
        if (row?.style.display === "table-row") btn.click();
    });
});

})();
