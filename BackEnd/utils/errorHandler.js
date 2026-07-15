const errorHandler = (res, error) => {
  console.log("Error caught by errorHandler:", error);

  return res
    .status(500)
    .json({ success: false, message: "Server error", error: error.message });
};
