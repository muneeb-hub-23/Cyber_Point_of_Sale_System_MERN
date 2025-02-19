import apiaddress from '../../../apirequests/apiaddress'
export const fetchCustomers = async (token) => {
    let data = await fetch(apiaddress + "/customers/getcustomergroup", {
        method: "GET",
        headers: {
            token
        }
    })
    let parsed = await data.json()
    return parsed
}

export const handleSearchChange = (
    e,
    searchType,
    setSearchTerm,
    setSuggestions,
    products
) => {
    const value = e.target.value;

    // Update searchTerm based on conditions
    if (searchType === 'barcode' && !isNaN(parseInt(value))) {
        setSearchTerm(value);
    } else if (searchType === 'name' || searchType === 'category') {
        setSearchTerm(value);
    } else if (value === '') {
        setSearchTerm(value);
    }

    if (value.length > 0) {
        let filteredProducts = [];

        if (searchType === 'barcode') {
            filteredProducts = products.filter((product) =>
                product.itemCode && Number(product.itemCode) === Number(value)
            );
        } else if (searchType === 'name') {
            filteredProducts = products.filter((product) =>
                product.name && product.name.toLowerCase().includes(value.toLowerCase())
            );
        } else if (searchType === 'category') {
            filteredProducts = products.filter((product) =>
                product.category && product.category.name && product.category.name.toLowerCase().includes(value.toLowerCase())
            );
        }

        setSuggestions(filteredProducts);
    } else {
        setSuggestions([]); // Clear suggestions if searchTerm is empty
    }
};

export const fetchProducts = async () => {
    let data = await fetch(apiaddress + '/management/products/getallproducts', {
        method: "GET"
    });
    let parsed = await data.json();
    return parsed;
};

export const handleItemDiscount = async (
    item,
    type,
    amount,
    itemsList,
    setitemsList,
    selectedBill,
    apiaddress,
    getDocumentItems
) => {
    let amounta = Number(amount); // Convert to a number

    if (!isNaN(amounta)) {
        amount = amounta; // If the value is a valid number, assign it to amount
    } else if (typeof amount === 'string' && amount.slice(-1) === '-') {
        amount = Number(amount.slice(0, -1)) * -1; // Remove the hyphen and convert the rest to a negative number
    } else {
        return; // If it's not a number and doesn't end with a hyphen, return (do nothing)
    }

    let updatedItems = [];
    let updatedItem = itemsList.find(f => f._id === item._id);

    // Initialize the discount object if not already present
    updatedItem.discount = updatedItem.discount || { amount: 0, percentage: 0 };

    if (type === "percentage") {
        // Calculate discount amount based on percentage
        updatedItem.discount.percentage = amount;
        updatedItem.discount.amount = parseFloat((updatedItem.sale * (amount / 100)).toFixed(2));
    } else if (type === "amount") {
        // Calculate discount percentage based on amount
        updatedItem.discount.amount = amount;
        updatedItem.discount.percentage = parseFloat(((amount / updatedItem.sale) * 100).toFixed(2));
    }

    // Calculate final price and sale amount based on discount
    updatedItem.finalprice = updatedItem.sale - updatedItem.discount.amount;
    updatedItem.saleamount = updatedItem.finalprice * updatedItem.qty;
    updatedItems.push(updatedItem);

    try {
        // Send updated items list to the API
        const response = await fetch(`${apiaddress}/pos/documentitems/adddiscount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItems),
        });

        const result = await response.json();

        if (result.success) {
            // Update the itemsList and calculate the total if the API call was successful
            let items = await getDocumentItems(selectedBill._id);
            setitemsList(items);
        } else {
            // Show an error message if the API call failed
            alert("Error: " + (result.message || "Failed to apply discount."));
        }
    } catch (error) {
        // Handle fetch errors (e.g., network issues)
        alert("Error: " + error.message);
    }
};

// handleEnterKey.js

  
  