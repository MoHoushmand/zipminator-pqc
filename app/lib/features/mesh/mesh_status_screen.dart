import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Pillar 9 — Q-Mesh status panel.
///
/// Displays the operational state of the Q-Mesh fleet:
///   - mesh node count
///   - last rotation timestamp
///   - active threat level
///   - per-node PSK epoch
///
/// Backed by a static JSON fixture (`fixtures/mesh_status.json`); a future
/// iteration will swap the loader for a live FFI/REST call to the Tauri
/// or FastAPI backend without changing the widget tree.
class MeshStatusScreen extends StatefulWidget {
  const MeshStatusScreen({super.key, this.statusLoader});

  /// Override the default loader (asset bundle) for testing.
  /// When null, the widget reads `fixtures/mesh_status.json` from rootBundle.
  final Future<MeshStatus> Function()? statusLoader;

  @override
  State<MeshStatusScreen> createState() => _MeshStatusScreenState();
}

class _MeshStatusScreenState extends State<MeshStatusScreen> {
  late Future<MeshStatus> _future;

  @override
  void initState() {
    super.initState();
    _future = (widget.statusLoader ?? _defaultLoader)();
  }

  static Future<MeshStatus> _defaultLoader() async {
    final raw = await rootBundle.loadString(
      'lib/features/mesh/fixtures/mesh_status.json',
    );
    return MeshStatus.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Q-Mesh Status')),
      body: FutureBuilder<MeshStatus>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Failed to load mesh status: ${snapshot.error}',
                style: const TextStyle(color: Colors.redAccent),
              ),
            );
          }
          final status = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _SummaryCard(status: status),
              const SizedBox(height: 16),
              _ThreatLevelCard(level: status.activeThreatLevel),
              const SizedBox(height: 16),
              _ModuleKeysCard(keys: status.moduleKeysPresent),
              const SizedBox(height: 16),
              ...status.nodes.map((n) => _NodeTile(node: n)),
            ],
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

@immutable
class MeshStatus {
  const MeshStatus({
    required this.meshId,
    required this.nodeCount,
    required this.activeThreatLevel,
    required this.lastRotationUnixMs,
    required this.rotationCounter,
    required this.moduleKeysPresent,
    required this.nodes,
  });

  final String meshId;
  final int nodeCount;
  final String activeThreatLevel;
  final int lastRotationUnixMs;
  final int rotationCounter;
  final List<String> moduleKeysPresent;
  final List<MeshNode> nodes;

  factory MeshStatus.fromJson(Map<String, dynamic> json) {
    return MeshStatus(
      meshId: json['mesh_id'] as String,
      nodeCount: json['node_count'] as int,
      activeThreatLevel: json['active_threat_level'] as String,
      lastRotationUnixMs: json['last_rotation_unix_ms'] as int,
      rotationCounter: json['rotation_counter'] as int,
      moduleKeysPresent: (json['module_keys_present'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      nodes: (json['nodes'] as List<dynamic>)
          .map((e) => MeshNode.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

@immutable
class MeshNode {
  const MeshNode({
    required this.nodeId,
    required this.name,
    required this.online,
    required this.isCoordinator,
    required this.pskEpoch,
    required this.lastBeaconUnixMs,
  });

  final String nodeId;
  final String name;
  final bool online;
  final bool isCoordinator;
  final int pskEpoch;
  final int lastBeaconUnixMs;

  factory MeshNode.fromJson(Map<String, dynamic> json) {
    return MeshNode(
      nodeId: json['node_id'] as String,
      name: json['name'] as String,
      online: json['online'] as bool,
      isCoordinator: json['is_coordinator'] as bool,
      pskEpoch: json['psk_epoch'] as int,
      lastBeaconUnixMs: json['last_beacon_unix_ms'] as int,
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.status});

  final MeshStatus status;

  @override
  Widget build(BuildContext context) {
    final lastRotation =
        DateTime.fromMillisecondsSinceEpoch(status.lastRotationUnixMs).toUtc();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mesh: ${status.meshId}',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _kv('Nodes', '${status.nodeCount}'),
            _kv('Rotation #', '${status.rotationCounter}'),
            _kv(
              'Last rotation',
              '${lastRotation.toIso8601String()} UTC',
            ),
          ],
        ),
      ),
    );
  }

  Widget _kv(String key, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 130, child: Text(key)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThreatLevelCard extends StatelessWidget {
  const _ThreatLevelCard({required this.level});

  final String level;

  Color _color() {
    switch (level.toLowerCase()) {
      case 'normal':
        return Colors.green;
      case 'elevated':
        return Colors.amber;
      case 'high':
        return Colors.deepOrange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color();
    return Card(
      color: color.withValues(alpha: 0.10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.shield, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Threat level',
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                  Text(
                    level,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ModuleKeysCard extends StatelessWidget {
  const _ModuleKeysCard({required this.keys});

  final List<String> keys;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Wave-1 module keys provisioned',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: keys
                  .map((k) => Chip(
                        label: Text(k),
                        backgroundColor: Colors.cyan.withValues(alpha: 0.10),
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _NodeTile extends StatelessWidget {
  const _NodeTile({required this.node});

  final MeshNode node;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(
          node.online ? Icons.lan : Icons.lan_outlined,
          color: node.online ? Colors.green : Colors.grey,
        ),
        title: Text(node.name),
        subtitle: Text(
          'epoch ${node.pskEpoch} · ${node.nodeId.substring(0, 8)}…'
          '${node.isCoordinator ? " · coordinator" : ""}',
        ),
        trailing: Text(
          node.online ? 'online' : 'offline',
          style: TextStyle(
            color: node.online ? Colors.green : Colors.grey,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
