import apiaddress from './apiaddress'
export const fetchBills = async (doctype, user, status, linkedShop, datenow, token) => {
    let data = await fetch(apiaddress + '/pos/documents/getdocuments', {
        method: "GET",
        headers: {
            doctype, user, status, linkedShop, datenow, token
        }
    })
    let parsed = await data.json()
    return parsed
}
export const fetchBillsx = async (doctype, user, status, linkedShop, datenow, token) => {
    let data = await fetch(apiaddress + '/pos/documents/getdocumentsforsale', {
        method: "GET",
        headers: {
            doctype, user, status, linkedShop, datenow, token
        }
    })
    let parsed = await data.json()
    return parsed
}
export const formatTimestampTo12Hour = (timestamp) => {
    const date = new Date(timestamp);

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${formattedMinutes} ${ampm}`;
}
export const reverseDate = (input) => {
    const year = input.slice(0, 4);
    const month = input.slice(4, 6);
    const day = input.slice(6, 8);

    const date = new Date(`${year}-${month}-${day}`);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };

    return date.toLocaleDateString('en-US', options);
}
export const createBill = async (doctype, user, status, linkedShop, date, customer = 'no', token) => {
    let data = await fetch(apiaddress + '/pos/documents/createdocument', {
        method: "POST",
        headers: {
            'content-type': 'application/json',
            token
        },
        body: JSON.stringify({
            doctype, user, status, linkedShop, date, customer
        })
    })
    let parsed = await data.json()
    return parsed
}
export const deleteDocument = async (id, doctype, user, status, linkedShop, date, token) => {
    let data = await fetch(apiaddress + '/pos/documents/deletedocument', {
        method: "DELETE",
        headers: {
            'content-type': 'application/json'
            , token
        },
        body: JSON.stringify({
            doctype, user, status, linkedShop, date, docid: id
        })
    })
    let parsed = await data.json()
    return parsed
}
export const createDocumentItem = async (item, token) => {
    let data = await fetch(apiaddress + '/pos/documentitems/createdocumentitem', {
        method: "POST",
        headers: {
            'content-type': 'application/json'
            , token
        },
        body: JSON.stringify(item)

    })
    let parsed = await data.json()
    return parsed
}
export const deleteDocumentItem = async (id, token) => {
    let data = await fetch(apiaddress + '/pos/documentitems/deletedocumentitem', {
        method: "DELETE",
        headers: {
            id,
            token
        }
    })
    let parsed = await data.json()
    return parsed
}
export const getDocumentItems = async (document, token) => {
    let data = await fetch(apiaddress + '/pos/documentitems/getdocumentitems', {
        method: "GET",
        headers: {
            document,
            token
        }
    })
    let parsed = await data.json()
    return parsed
}
export const changeQtyOfItem = async (id, newqty, token) => {
    const itemId = typeof id === 'object' && id !== null ? (id._id || id.id) : id
    let data = await fetch(apiaddress + '/pos/documentitems/changeitemqty', {
        method: "POST",
        headers: {
            'content-type': 'application/json',
            token
        },
        body: JSON.stringify({ id: itemId, qty: newqty })

    })
    let parsed = await data.json()
    return parsed
}