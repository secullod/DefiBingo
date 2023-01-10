import {render} from "react-dom";
import React from "react";
import {App} from "./App";


const el = document.querySelector("#app");
el && render(<App/>, el);
