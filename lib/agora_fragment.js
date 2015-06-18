
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

 var n3 = require('n3');
 var config = GLOBAL.config;

 var filter_n3 = function filter_n3 (list_triples, filter) {
    var result = [];
    for (var i = 0; i < list_triples.length; i++) {
        result.push(list_triples[i][filter]);
    }
    return result;
 };

 // Performs a backward search from a list of pattern nodes and assigns a set of search spaces
 // to all encountered nodes.
 // :param nodes: List of pattern nodes that belongs to a search space
 // :param space: List of search space id
 // :param plan: Dict of graph and other important parameters
 // :return:
 var decorate_nodes = function decorate_nodes (nodes, space, plan) {
     var pred_nodes = {};
     for (var i = 0; i < nodes.length; i++) {
         if (nodes[i] in plan["node_spaces"]) {
             graph["node_spaces"][nodes[i]] = new Set();
         }
         plan["node_spaces"][nodes[i]].add(space)
         pred_nodes = plan["graph"]["triples"].find(null, config.AGORA_NEXT, nodes[i]);
         pred_nodes = filter_n3(pred_nodes, "subject");
         decorate_nodes(pred_nodes, space, plan)
     }
 };

 // Analyses the search plan graph in order to build the required data structures from patterns
 // and spaces.
 // :param plan: Dict of graph and other important parameters
 // :return:
 var extract_patterns_and_spaces = function extract_patterns_and_spaces (plan) {
     var spaces = plan.graph.triples.find(null, RDF_TYPE, config.AGORA_SEARCHSPACE);
     spaces = filter_n3(spaces, "subject");
     plan["subjects_to_ignore"] = {};
     for (var i = 0; i < spaces.length; i++) {
         plan["subjects_to_ignore"][spaces[i]] = new Set();
     }

 };
