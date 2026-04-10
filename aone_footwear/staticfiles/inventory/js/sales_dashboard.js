console.log("sales_dashboard loaded");

let currentPage = 1;
let currentPageSize = 10;
let currentRows = [];
let collectPaymentModal = null;
let salesTrendChart = null;
let paymentModeChart = null;

function formatMoney(v) {
    return parseFloat(v || 0).toFixed(2);
}

function getCsrfToken() {
    const tokenInput = document.querySelector("#collect_payment_form input[name='csrfmiddlewaretoken']");
    return tokenInput ? tokenInput.value : "";
}

function getFilters() {
    return {
        start_date: document.getElementById("filter_start").value,
        end_date: document.getElementById("filter_end").value,
        search: document.getElementById("search_box").value.trim(),
    };
}

function buildDashboardUrl() {
    const filters = getFilters();
    const params = new URLSearchParams({
        page: currentPage,
        page_size: currentPageSize,
    });

    if (filters.start_date) params.set("start_date", filters.start_date);
    if (filters.end_date) params.set("end_date", filters.end_date);
    if (filters.search) params.set("search", filters.search);

    return `/api/sales/dashboard-data/?${params.toString()}`;
}

function buildExportUrl() {
    const filters = getFilters();
    const params = new URLSearchParams();

    if (filters.start_date) params.set("start_date", filters.start_date);
    if (filters.end_date) params.set("end_date", filters.end_date);
    if (filters.search) params.set("search", filters.search);

    return `/sales/export/?${params.toString()}`;
}

function renderPaymentCell(row) {
    if (row.can_collect_payment) {
        return `
            <button
                type="button"
                class="btn btn-sm btn-warning"
                onclick="openCollectPaymentModal(${row.bill_id})">
                Collect Payment
            </button>
        `;
    }

    return row.payment;
}

function buildTable(table) {
    currentRows = table.rows || [];

    const tbody = document.getElementById("sales_table_body");
    tbody.innerHTML = "";

    if (!currentRows.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">No Data</td></tr>`;
        return;
    }

    currentRows.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td><a href="/invoice/${r.bill_id}/" target="_blank">${r.bill_no}</a></td>
        <td>${r.date}</td>
        <td class="text-center">${r.customer_name || ""}</td>
        <td class="text-center">${r.customer_mobile || ""}</td>
        <td class="text-center">${r.qty}</td>
        <td class="text-center">Rs. ${formatMoney(r.amount)}</td>
        <td class="text-center">Rs. ${formatMoney(r.total_payment)}</td>
        <td class="text-center">Rs. ${formatMoney(r.payment_received)}</td>
        <td class="text-center">Rs. ${formatMoney(r.balance_due)}</td>
        <td class="text-center">${renderPaymentCell(r)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePagination(table) {
    const page = table.page || 1;
    const totalPages = table.total_pages || 1;

    document.getElementById("current_page").innerText = page;
    document.getElementById("total_pages").innerText = totalPages;
    document.getElementById("btn_prev_page").disabled = page <= 1;
    document.getElementById("btn_next_page").disabled = page >= totalPages;
    document.getElementById("table_meta_text").innerText = `Showing ${table.rows.length} of ${table.total_rows} bills`;
}

function updateKpis(kpis) {
    document.getElementById("kpi_today_sales").innerText = formatMoney(kpis.today_sales);
    document.getElementById("kpi_last7_sales").innerText = formatMoney(kpis.last7_sales);
    document.getElementById("kpi_total_sales").innerText = formatMoney(kpis.total_sales);
    document.getElementById("kpi_total_qty").innerText = kpis.total_qty;
    document.getElementById("kpi_pending_credit").innerText = formatMoney(kpis.pending_credit);
}

function updateFilterInputs(meta) {
    document.getElementById("filter_start").value = meta.start_date || "";
    document.getElementById("filter_end").value = meta.end_date || "";
}

function updatePaymentModes(payments) {
    const container = document.getElementById("payment_modes_container");
    if (!payments.length) {
        container.innerHTML = `<div class="text-muted small">No sales yet.</div>`;
        return;
    }

    const total = payments.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    container.innerHTML = payments.map((item) => {
        const amount = parseFloat(item.amount || 0);
        const percent = total > 0 ? (amount / total) * 100 : 0;

        return `
            <div class="mb-3">
                <div class="d-flex justify-content-end align-items-center mb-1 small text-muted">
                    <span>Rs. ${formatMoney(amount)}</span>
                </div>
                <div class="progress" style="height: 22px;">
                    <div
                        class="progress-bar d-flex align-items-center justify-content-end pe-2 fw-semibold"
                        role="progressbar"
                        style="width: ${Math.max(percent, 12).toFixed(2)}%;"
                        aria-valuenow="${percent.toFixed(2)}"
                        aria-valuemin="0"
                        aria-valuemax="100">${item.mode}</div>
                </div>
            </div>
        `;
    }).join("");
}

function buildSalesTrendChart(trend) {
    const ctx = document.getElementById("chart_sales_trend");
    if (!ctx) return;

    if (salesTrendChart) {
        salesTrendChart.destroy();
    }

    salesTrendChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: trend.map((item) => item.label),
            datasets: [{
                label: "Sales Amount",
                data: trend.map((item) => item.amount),
                borderColor: "#0d6efd",
                backgroundColor: "rgba(13, 110, 253, 0.15)",
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function buildPaymentModeChart(payments) {
    const ctx = document.getElementById("chart_payment_modes");
    if (!ctx) return;

    if (paymentModeChart) {
        paymentModeChart.destroy();
    }

    paymentModeChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: payments.map((item) => item.mode),
            datasets: [{
                label: "Amount",
                data: payments.map((item) => item.amount),
                backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadDashboard() {
    fetch(buildDashboardUrl())
        .then((res) => res.json())
        .then((data) => {
            updateKpis(data.kpis);
            updateFilterInputs(data.meta);
            updatePaymentModes(data.payments || []);
            buildSalesTrendChart(data.trend || []);
            buildPaymentModeChart(data.payments || []);
            buildTable(data.table);
            updatePagination(data.table);
        })
        .catch((err) => {
            console.error("Dashboard load error", err);
        });
}

function findRowByBillId(billId) {
    return currentRows.find((row) => row.bill_id === billId);
}

function openCollectPaymentModal(billId) {
    const row = findRowByBillId(billId);
    if (!row) return;

    document.getElementById("collect_bill_id").value = row.bill_id;
    document.getElementById("collect_bill_no").value = row.bill_no;
    document.getElementById("collect_balance_due").value = `Rs. ${formatMoney(row.balance_due)}`;
    document.getElementById("collect_amount").value = formatMoney(row.balance_due);
    document.getElementById("collect_amount").max = formatMoney(row.balance_due);
    document.querySelector("input[name='collect_payment_mode'][value='CASH']").checked = true;

    const errorBox = document.getElementById("collect_payment_error");
    errorBox.classList.add("d-none");
    errorBox.innerText = "";

    collectPaymentModal.show();
}

function submitCollectedPayment(event) {
    event.preventDefault();

    const billId = document.getElementById("collect_bill_id").value;
    const amount = parseFloat(document.getElementById("collect_amount").value || 0);
    const selectedMode = document.querySelector("input[name='collect_payment_mode']:checked");
    const errorBox = document.getElementById("collect_payment_error");
    const submitBtn = document.getElementById("collect_payment_submit_btn");
    const row = findRowByBillId(parseInt(billId, 10));

    errorBox.classList.add("d-none");
    errorBox.innerText = "";

    if (!row) {
        errorBox.innerText = "Unable to find bill details.";
        errorBox.classList.remove("d-none");
        return;
    }

    if (!(amount > 0)) {
        errorBox.innerText = "Enter a valid amount.";
        errorBox.classList.remove("d-none");
        return;
    }

    if (amount > parseFloat(row.balance_due || 0)) {
        errorBox.innerText = "Collected amount cannot be greater than balance due.";
        errorBox.classList.remove("d-none");
        return;
    }

    submitBtn.disabled = true;

    fetch(`/api/sales/${billId}/collect-payment/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": getCsrfToken(),
            "X-Requested-With": "XMLHttpRequest"
        },
        body: new URLSearchParams({
            amount: amount.toFixed(2),
            payment_mode: selectedMode ? selectedMode.value : "CASH"
        })
    })
        .then((res) => res.json())
        .then((data) => {
            if (!data.success) {
                throw new Error(data.error || "Unable to collect payment");
            }

            collectPaymentModal.hide();
            loadDashboard();
        })
        .catch((err) => {
            errorBox.innerText = err.message || "Unable to collect payment";
            errorBox.classList.remove("d-none");
        })
        .finally(() => {
            submitBtn.disabled = false;
        });
}

function applyFilters() {
    currentPage = 1;
    loadDashboard();
}

function clearFilters() {
    document.getElementById("filter_start").value = "";
    document.getElementById("filter_end").value = "";
    document.getElementById("search_box").value = "";
    currentPage = 1;
    loadDashboard();
}

function exportSales() {
    window.location.href = buildExportUrl();
}

document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById("collectPaymentModal");
    if (modalEl) {
        collectPaymentModal = new bootstrap.Modal(modalEl);
    }

    const form = document.getElementById("collect_payment_form");
    if (form) {
        form.addEventListener("submit", submitCollectedPayment);
    }

    document.getElementById("btn_apply_filter").addEventListener("click", applyFilters);
    document.getElementById("btn_clear_filter").addEventListener("click", clearFilters);
    document.getElementById("btn_export_excel").addEventListener("click", exportSales);

    document.getElementById("search_box").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            applyFilters();
        }
    });

    document.getElementById("rows_per_page").addEventListener("change", function () {
        currentPageSize = parseInt(this.value || 10, 10);
        currentPage = 1;
        loadDashboard();
    });

    document.getElementById("btn_prev_page").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage -= 1;
            loadDashboard();
        }
    });

    document.getElementById("btn_next_page").addEventListener("click", function () {
        currentPage += 1;
        loadDashboard();
    });

    loadDashboard();
});

window.openCollectPaymentModal = openCollectPaymentModal;
