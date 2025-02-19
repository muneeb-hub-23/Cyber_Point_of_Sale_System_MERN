const verifyer = async (req, res, next) => {
    if (req.headers.token) {
        console.log(req.body);  // Logging request body
        next();  // Allow the request to proceed
    } else {
        console.log("no token")
        return res.status(401).json({
            success: false,  // Change to false for errors
            message: "Request Not Authorized"
        });
    }
};

module.exports = verifyer