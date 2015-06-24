
 /*
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      This file is part of the Smart Developer Hub Project:
        http://www.smartdeveloperhub.org/
      Center for Open Middleware
            http://www.centeropenmiddleware.com/
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      Copyright (C) 2015 Center for Open Middleware.
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      Licensed under the Apache License, Version 2.0 (the "License");
      you may not use this file except in compliance with the License.
      You may obtain a copy of the License at
                http://www.apache.org/licenses/LICENSE-2.0
      Unless required by applicable law or agreed to in writing, software
      distributed under the License is distributed on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      See the License for the specific language governing permissions and
      limitations under the License.
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
      contributors: Alejandro F. Carrera
    #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
*/

var request = require('sync-request');
var N3 = require('n3');
var config = GLOBAL.config;

 // Generate graph with triples and prefixes for a given plan
 // :param plan: String of plan in text/turtle format
 // :return:
var get_graph_from_plan = function get_graph_from_plan (plan) {
    var parser = N3.Parser();
    var rdfStore = N3.Store();
    parser.parse(plan, function(error, triple, prefixes){
        if (error) {
            return { "status": "ERROR" };
        }
        if (triple) {
            rdfStore.addTriple(triple.subject, triple.predicate, triple.object, "");
        }
        else {
            return {
                "status": "OK",
                "graph": {
                    "triples": rdfStore,
                    "prefixes": prefixes
                }
            };
        }
    });
};

// Request the planner a search plan for a given gp
// :param gp: String of graph pattern
// :return:
module.exports.get_plan = function get_plan (gp) {
    var http_path = config.services.planner.url + ":" +
        config.services.planner.port + config.services.planner.path +
        config.services.planner.query_param + encodeURIComponent(gp);
    try {
        var req = request('GET', http_path, {
            "headers": config.headers
        });
        if (req.statusCode === 200) {
            return get_graph_from_plan(req.body);
        }
        else {
            return {"status": "ERROR"};
        }
    }
    catch (err) {
        return {"status": "ERROR"};
    }
};