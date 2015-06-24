
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
 var request = require('sync-request');
 var config = GLOBAL.config;

 // Performs a search into N3 Object.
 // :param s: Search's Subject
 // :param p: Search's Predicate
 // :param o: Search's Object
 // :param plan: Dict of graph and other important parameters
 // :param filter: "subject"|"predicate"|"object"
 // :return:
 var filter_n3 = function filter_n3 (s, p, o, plan, filter) {
    var t = plan["graph"].triples.find(s, p, o);
    for (var i = 0; i < t.length; i++) {
        t[i] = t[i][filter];
    }
    return t;
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
         var n = nodes[i];
         if (typeof plan["node_spaces"][n] === 'undefined') {
             plan["node_spaces"][n] = {};
         }
         plan["node_spaces"][n][space] = '1';
         pred_nodes = filter_n3(null, config.AGORA_NEXT, n, plan, "subject");
         decorate_nodes(pred_nodes, space, plan)
     }
 };

 // Regenerate parameters for graph
 // :param plan: Dict of graph and other important parameters
 // :return:
 var init_plan = function init_plan (plan) {
     plan["uri_cache"] = [];
     plan["node_spaces"] = {};
     plan["node_patterns"] = {};
     plan["patterns"] = {};
     plan["spaces"] = filter_n3(null, config.RDF_TYPE, config.AGORA_SEARCHSPACE, plan, "subject");

     // Extract all search spaces in the plan and build a dictionary of subjects-to-ignore
     // per each of them. Ignored subjects are those that won't be dereferenced due to a
     // explicit graph pattern (object) filter, e.g. ?s doap:name "jenkins" -> All ?s that
     // don't match the filter will be ignored.
     plan["subjects_to_ignore"] = {};
     for (var i = 0; i < plan["spaces"].length; i++) {
         plan["subjects_to_ignore"][plan["spaces"][i]] = [];
     }
 };

 // Load in a tree graph the set of triples contained in uri, trying to not deference the same uri
 // more than once in the context of a search plan execution
 // :param tg: The graph to be loaded with all the triples obtained from uri
 // :param uri: A resource uri to be dereferenced
 // :return:
 var dereference_uri = function dereference_uri (plan, tg, uri) {
     var loaded = false;
     if (uri in plan["uri_cache"]) {
         try {
             var res = request('GET', uri, {
                 'headers': config.headers
             });
         } catch (err) {

         }
     }

 };

 // Analyses the search plan graph in order to build the required data structures from patterns
 // and spaces.
 // :param plan: Dict of graph and other important parameters
 // :return:
 var extract_patterns_and_spaces = function extract_patterns_and_spaces (plan) {

     init_plan(plan);

     var patterns = filter_n3(null, config.RDF_TYPE, config.AGORA_TRIPATTERN, plan, "subject");
     for (var i = 0; i < patterns.length; i++) {

        var tp = patterns[i];

        // A triple pattern belongs to a UNIQUE search space
        var space = filter_n3(null, config.AGORA_DEFINEDBY, tp, plan, "subject")[0];
        plan["patterns"][tp] = {"space": space};

        // Depending on the format of each triple pattern (either '?s a Concept' or '?s prop O')
        // it is required to extract different properties.
        var tp_pred = filter_n3(tp, config.AGORA_PREDICATE, null, plan, "object")[0];
        if (tp_pred === config.RDF_TYPE) { // ?s a Concept
            plan["patterns"][tp]['type'] = filter_n3(tp, config.AGORA_OBJECT, null, plan, "object")[0];
            try {
                plan["patterns"][tp]['check'] = filter_n3(tp, config.AGORA_CHECKTYPE, null, plan, "object")[0];
            } catch(err) {
                plan["patterns"][tp]['check'] = true;
            }
        }
        else { // ?s prop O
            plan["patterns"][tp]['property'] = tp_pred;
            var tp_obj = filter_n3(tp, config.AGORA_OBJECT, null, plan, "object")[0];
            if (plan.graph.triples.find(tp_obj, config.RDF_TYPE, config.AGORA_LITERAL).length > 0) {
                plan["patterns"][tp]['filter'] = filter_n3(tp_obj, config.AGORA_VALUE, null, plan, "object")[0];
            }
        }

        // Get all pattern nodes (those that have a byPattern properties) of the search plan and search backwards
        // in order to set the scope of each search space.
        var nodes = filter_n3(null, config.AGORA_BYPATTERN, tp, plan, "subject");
        for(var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (typeof plan["node_patterns"][n] === 'undefined') {
                plan["node_patterns"][n] = {};
            }
            plan["node_patterns"][n][tp] = '1';
        }
        decorate_nodes(nodes, space, plan);
     }
 };

 // Return the value of the Agora length property in the given tree node
 // :param plan: Dict of graph and other important parameters
 // :return:
 var get_trees = function get_trees (plan) {
     var trees = filter_n3(null, config.RDF_TYPE, config.AGORA_SEARCHTREE, plan, "subject");
     var trees_ob = [];
     for (var i = 0; i < trees.length; i++) {
         trees_ob.push([trees[i], filter_n3(trees[i], config.AGORA_LENGTH, null, plan, "object")[0]]);
     }
     trees_ob.sort(function(a, b){ return a[1] - b[1]});
     trees = [];
     for (var i = 0; i < trees_ob.length; i++) {
         trees.push(trees_ob[i][0]);
     }
     return trees;
 }

 // Check if a node is a pattern node and has an object filter
 var node_has_filter = function node_has_filter(plan, x) {
     var p_node = filter_n3(x, config.AGORA_BYPATTERN, null, plan, "object");
     if (p_node.length > 0) {
         return (typeof plan["patterns"][p_node[0]]["filter"] !== 'undefined');
     }
     return false;
 };

 // Return the value of the Agora length property in the given tree node
 // :param plan: Dict of graph and other important parameters
 // :return:
 var get_nodes = function get_nodes (plan, node) {
     var nxt = filter_n3(node, config.AGORA_NEXT, null, plan, "object");
     var nxt_ob = [];
     for (var i = 0; i < nxt.length; i++) {
         nxt_ob.push(nxt[i], node_has_filter(plan, nxt[i]));
     }
     nxt_ob.sort(function(a, b){ return b[1] - a[1]});
     nxt = [];
     for (var i = 0; i < nxt_ob.length; i++) {
         nxt.push(nxt_ob[i][0]);
     }
     return nxt;
 }

 // Recursively search for relevant triples following the current node and all its successors
 // :param node: Tree node to be followed
 // :param tree_graph:
 // :param node_seeds: Set of collected seeds for the current node
 // :return:
 var follow_node = function follow_node (plan, node, tree_graph, node_seeds) {

     // Get the sorted list of current node's successors
     var nxt = get_nodes(plan, node);

     // Per each successor...
     for (var i = 0; i < nxt.length; i++) {

        // Get all its search spaces and pattern nodes (if any)
        var search_spaces = Object.keys(plan["node_spaces"][n]);
        var next_seeds = {};
        for (var j = 0; j < search_spaces.length; j++) {
            next_seeds[search_spaces[j]] = {};
        }
        var node_patterns = [];
        var n_patterns = Object.keys(plan["node_patterns"][n]);
        for (var j = 0; j < n_patterns.length; j++) {
            node_patterns.push([n, n_patterns[j]]);
        }

        // In case the node is not a leaf, 'onProperty' tells which is the next link to follow
        var link;
        try {
            link = filter_n3(n, config.AGORA_ONPROPERTY, null, plan, "object")[0];
        }
        catch (err) {
            link = null;
        }

        // If the current node is a pattern node, it must search for triples to yield
        for (var j = 0; j < node_patterns.length; j++) {
            var pattern = node_patterns[j];
            var pattern_space = plan["patterns"][pattern]["space"];
            var pattern_link = (typeof plan["patterns"][pattern]["property"] === 'undefined') ?
                null : plan["patterns"][pattern]["property"];
            var filtered_seeds = [];
            for (var z = 0; z < node_seeds[pattern_space].length; z++) {
                if (!node_seeds[pattern_space][z] in plan["subjects_to_ignore"]["pattern_space"]) {
                    filtered_seeds.push(node_seeds[pattern_space[z]]);
                }
            }
            // If pattern is of type '?s prop O'...
            if (pattern_link !== null) {
                var obj_filter = (typeof plan["patterns"][pattern]["filter"] === 'undefined') ?
                    null : plan["patterns"][pattern]["filter"];


                for (var z = 0; z < filtered_seeds.length; z++) {
                    var seed = filtered_seeds[z];
                    // Dereference_uri(tree_graph, seed);
                    var seed_pattern_objects = filter_n3(seed, pattern_link, null, plan, "object");

                        filtered_seeds.push(node_seeds[pattern_space[z]]);
                }
            }
        }

     }



 };

 // Iterate over all search trees and yield relevant triples
 // :return:
 var get_fragment_triples = function get_fragment_triples (plan) {
    var trees = get_trees(plan);
    for (var i = 0; i < trees.length; i++) {

        var tree = trees[i];

        // Prepare an dedicated graph for the current tree and a set of type triples (?s a Concept)
        // to be evaluated retrospectively
        var tree_graph = ConjunctiveGraph()
        var type_triples = {};

        // Get all seeds of the current tree
        var seeds = filter_n3(tree, config.AGORA_SEED, null, plan, "object");

        // Check if the tree root is a pattern node and in that case, adds a type triple to the
        // respective set
        var root_pattern = filter_n3(tree, config.AGORA_BYPATTERN, null, plan, "object");
        if (root_pattern.length > 0) {
            var pattern_node = root_pattern[0];
            var seed_type = (typeof plan["patterns"][pattern_node]["type"] === 'undefined') ?
                null : plan["patterns"][pattern_node]["type"];
            for (var j = 0; j < seeds.length; j++) {
                var s = seeds[j];
                if (typeof type_triples[s] === 'undefined') {
                    type_triples[s] = {};
                }
                type_triples[s][seed_type] = '1';
            }
        }

        // Get the children of the root node and follow them recursively
        var nxt = filter_n3(tree, config.AGORA_NEXT, null, plan, "object");
        if (nxt.length > 0) {

            // Prepare the list of seeds to start the exploration with,
            // taking into account all search space that were defined
            var s_seeds = [];
            for (var j = 0; j < seeds.length; j++) {
                if (!seeds[j] in s_seeds) {
                    s_seeds.push(seeds[j]);
                }
            }
        }
        var root_seeds = {};
        for (var j = 0; j < plan["spaces"].length; j++) {
            root_seeds[plan["spaces"][j]] = s_seeds;
        }

        // Directly yield all found triples except for type ones, which will be evaluated retrospectively

     }
 };

 module.exports.get_fragment = function get_fragment (gp, callback) {
     extract_patterns_and_spaces(gp);
     get_fragment_triples(gp, callback);
 };

