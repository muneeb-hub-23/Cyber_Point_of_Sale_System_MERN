import { AiOutlineDashboard } from "react-icons/ai";
import { TbReportSearch } from "react-icons/tb";
import { FaUserSecret } from "react-icons/fa6";
import { MdAdd } from "react-icons/md";
import { IoHome } from "react-icons/io5";
import { FaPeopleRobbery } from "react-icons/fa6";
import { TiWarning } from "react-icons/ti";
import { FaComputer } from "react-icons/fa6";
import { SiAwssecretsmanager } from "react-icons/si";
import { FaCashRegister } from "react-icons/fa";


export const menuGroups = [
    {
        name: "",
        menuItems: [
            { icon: (<AiOutlineDashboard className="text-2xl" />), label: "Dashboard", route: "/dashboard", permission: "dashboard" },
            { icon: (<MdAdd className="text-2xl" />), label: "Khata Entry", route: "/khataentry", permission: "khataentry" },
            { icon: (<TbReportSearch className="text-2xl" />), label: "Search Bills", route: "/pos/searchbills", permission: "searchbills" },

            {
                icon: (<FaComputer className="text-2xl" />), label: "POS", route: "/pos", permission: "pos",
                children: [
                    { label: "Sale", route: "/pos/sale", permission: "sale" },
                    { label: "Purchase", route: "/pos/purchase", permission: "purchase" },
                    { label: "Refund", route: "/pos/refund", permission: "refund" },
                    { label: "Loss", route: "/pos/loss", permission: "loss" },
                    { label: "Stock Return", route: "/pos/stockreturn", permission: "stockreturn" },
                    { label: "expense", route: "/pos/expense", permission: "expense" }]

            },
            { icon: (<FaCashRegister className="text-2xl" />), label: "Cash Register", route: "/cashregister", permission: "cashregister" },
            {
                icon: (<TbReportSearch className="text-2xl" />), label: "Reports", route: "/reports", permission: "reports",
            },
            {
                icon: (<SiAwssecretsmanager className="text-2xl font-bold" />), label: "Management", route: "/management", permission: "management",
                children: [
                    { label: "Categories", route: "/management/categories", permission: "categories" },
                    { label: "Payment Methods", route: "/management/paymentmethods", permission: "paymentmethods" },
                    { label: "Add Products", route: "/management/addproducts", permission: "addproducts" },
                    { label: "Products List", route: "/management/products", permission: "products" },
                    { label: "Modify Products", route: "/management/modifyproducts", permission: "modifyproducts" },
                    { label: "Products Stock", route: "/management/stock", permission: "stock" },
                    { label: "Adjust Stock", route: "/management/adjuststock", permission: "adjuststock" },
                    { label: "Pending Products", route: "/management/pendingproducts", permission: "pendingproducts" },]
            },
            {
                icon: (<FaPeopleRobbery className="text-2xl" />), label: "Customers", route: "/customers", permission: "customers",
                children: [
                    { label: "Add Customers", route: "/customers/addcustomer", permission: "addcustomer" },
                    { label: "Modify Customers", route: "/customers/modifycustomer", permission: "modifycustomer" },
                    { label: "Delete Customers", route: "/customers/deletecustomer", permission: "deletecustomer" },
                    { label: "Customers Groups", route: "/customers/customergroup", permission: "customergroup" },
                    { label: "Create Customer Group", route: "/customers/customergroup/createcustomergroup", permission: "createcustomergroup" },
                    { label: "Modify | Delete C-Group", route: "/customers/customergroup/modifydeletecustomergroup", permission: "modifydeletecustomergroup" }]
            },
            {
                icon: (<IoHome className="text-2xl" />), label: "Shops", route: "/shops", permission: "shops",
                children: [
                    { label: "Create Shop", route: "/shops/createshop", permission: "createshop" },
                    { label: "Modify Shop", route: "/shops/modifyshop", permission: "modifyshop" },
                    { label: "Delete Shop", route: "/shops/deleteshop", permission: "deleteshop" }]
            },

            {
                icon: (<FaUserSecret className="text-2xl" />), label: "Users", route: "/users", permission: "users",
                children: [
                    { label: "Create User", route: "/users/createuser", permission: "createuser" },
                    { label: "Modify User", route: "/users/modifyuser", permission: "modifyuser" },
                    { label: "Delete User", route: "/users/deleteuser", permission: "deleteuser" },]
            },



        ],
    },
];