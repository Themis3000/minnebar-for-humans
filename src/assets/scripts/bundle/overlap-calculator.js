import * as stats from "../../../_data/stats.json";

window.addEventListener("load", (e) => {
  input1.addEventListener("input", updateOverlap);
  input2.addEventListener("input", updateOverlap);
});

function updateOverlap() {
  const url1 = input1.value;
  const url2 = input2.value;
  let connection = stats["connections"].find((connection) => {
    return connection["source"] === url1 && connection["target"] === url2 ||
      connection["source"] === url2 && connection["target"] === url1
  });
  if (!connection) {
    overlapSpan.innerText = "No overlap found";
    return;
  }
  overlapSpan.innerText = connection["count"];
}
