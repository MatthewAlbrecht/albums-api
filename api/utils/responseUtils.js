module.exports.sendResponse = (res, status, content, next) => {
  res.status(status);
  if (content instanceof Error) {
    console.log("ERROR\n", content, "\nERROR");
    let code, message;

    if (content.code) {
      code = content.code;
    }
    if (content.message) {
      message = content.message;
    }
    content = "Syntax or Reference Error";
    if (code || message) {
      content = { code, message };
    }

    res.json({ error: content });
  } else if (typeof content === "string") {
    res.json({ message: content });
  } else {
    res.json(content);
  }
};
