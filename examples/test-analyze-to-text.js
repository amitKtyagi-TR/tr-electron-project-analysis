"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("../src/index.js"); // Import the function from index.ts
var fs_1 = require("fs"); // For saving output to a file
var path_1 = require("path"); // For handling file paths
function testAnalysis() {
    return __awaiter(this, void 0, void 0, function () {
        var repoPath, options, flatText, outputFile, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    repoPath = '/Users/amitk/Development/GitHub/SOLARIUM-CPAPP';
                    options = {
                        exclude_test_files: true, // Exclude test files, like in your scripts
                        on_progress: function (completed, total, current) {
                            console.log("Progress: ".concat(completed, "/").concat(total, " - Analyzing ").concat(current));
                        }
                    };
                    console.log("Starting analysis of: ".concat(repoPath));
                    return [4 /*yield*/, (0, index_js_1.analyzeRepositoryToText)(repoPath, options)];
                case 1:
                    flatText = _a.sent();
                    // Option 1: Log the flat text to console for quick check
                    console.log('--- Flat Text Output ---');
                    console.log(flatText);
                    console.log('--- End of Output ---');
                    outputFile = (0, path_1.resolve)('test_output.txt');
                    (0, fs_1.writeFileSync)(outputFile, flatText, 'utf8');
                    console.log("\nSaved flat text to: ".concat(outputFile));
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Analysis failed:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testAnalysis();
